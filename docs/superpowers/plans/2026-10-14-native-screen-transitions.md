# Native-feel screen transitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every in-app navigation animates correctly (push/pop slide for in-content links, crossfade for tab-like navigation, shared-element morphs for charts and titles on desktop), and the dead framer-motion `layoutId` code is gone.

**Architecture:** A pure `navTransition` module decides transition types from pathnames. `WeekLink` (the single link choke point) and the command menu attach those types. `PageTransition` and `globals.css` map the types to animations. A small `SharedElement` wrapper replaces every `m.* layoutId` with `<ViewTransition name share="morph" default="none">`. Loading skeletons carry the same names so the morph pair forms even while data suspends.

**Tech Stack:** Next 16.4 (`transitionTypes` on `Link` and `router.push`), React 19.3 `<ViewTransition>`, Tailwind v4, Vitest (node env, `src/**/*.test.ts` only).

**Spec:** `docs/superpowers/specs/2026-10-14-native-screen-transitions-design.md`

## Global Constraints

- Read `apps/web/node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` before touching transition code (apps/web/AGENTS.md: this Next has breaking changes).
- Function-expression style (`const fn = () => {}`), Biome-formatted, line width 120. Let `npm run lint:fix` order imports.
- No barrel files. No new dependency. Removing `framer-motion` needs the user's explicit OK first (Task 6).
- Named `<ViewTransition>` with `default="none"` must keep `share="morph"`, or the pair silently stops morphing.
- A transition `name` must be unique among elements rendered on one page.
- Commits: no Co-Authored-By trailers, no "Generated with" lines (user's global rule overrides any attribution reminder).
- UI changes need real-browser verification (apps/web CLAUDE.md); `npm run prepush` must be green before finishing.
- Never `--no-verify`.

## File Structure

| File | Responsibility |
|---|---|
| `apps/web/src/lib/navTransition.ts` (new) | Pure: `navDepth`, `getNavTransitionTypes` |
| `apps/web/src/lib/navTransition.test.ts` (new) | Tests for the above |
| `apps/web/src/components/WeekLink/WeekLink.tsx` | Derive types by default; explicit prop wins |
| `apps/web/src/components/NavLink/NavLink.tsx` | Sidebar links are tab switches: `nav-fade` |
| `apps/web/src/components/CommandMenu/CommandMenu.client.tsx` | `router.push` with `nav-fade` |
| `apps/web/src/components/GameDetailsLink/GameDetailsLink.tsx`, `LiveGameStrip/LiveGameStrip.tsx` | Raw `Link` to `WeekLink` |
| `apps/web/src/components/ViewTransitions/PageTransition.tsx` | Map `nav-fade` |
| `apps/web/src/components/ViewTransitions/SharedElement.tsx` (new) | Named morph wrapper |
| `apps/web/src/app/globals.css` | Timing tokens, `nav-fade`, `.morph`, push polish |
| `RankingPieChart`, `ProgressChart`, `*Dashboard.client.tsx`, `ScenariosDashboard.client.tsx` | `m.*` to `SharedElement` |
| `apps/web/src/components/Providers/providers.tsx`, `package.json` | Remove framer-motion (Task 6) |

---

### Task 1: Pure navigation-direction module

**Files:**
- Create: `apps/web/src/lib/navTransition.ts`
- Test: `apps/web/src/lib/navTransition.test.ts`

**Interfaces:**
- Produces: `type NavTransitionType = "nav-back" | "nav-forward" | "nav-fade"`; `navDepth(pathname: string): number`; `getNavTransitionTypes(fromPathname: string, toHref: string): NavTransitionType[]`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";

import { getNavTransitionTypes, navDepth } from "./navTransition";

describe("navDepth", () => {
  it("treats the dashboard as the root", () => {
    expect(navDepth("/")).toBe(0);
    expect(navDepth("/?week=3")).toBe(0);
  });

  it("treats top-level pages as depth 1", () => {
    expect(navDepth("/weekly")).toBe(1);
    expect(navDepth("/picks/view")).toBe(1);
    expect(navDepth("/admin/users?week=2")).toBe(1);
  });

  it("treats a game page as depth 2", () => {
    expect(navDepth("/scoreboard/game/401")).toBe(2);
    expect(navDepth("/scoreboard/game/401?week=4")).toBe(2);
  });
});

describe("getNavTransitionTypes", () => {
  it("pushes when going deeper", () => {
    expect(getNavTransitionTypes("/", "/weekly?week=3")).toEqual(["nav-forward"]);
    expect(getNavTransitionTypes("/scoreboard", "/scoreboard/game/401?week=3")).toEqual(["nav-forward"]);
  });

  it("pops when going shallower", () => {
    expect(getNavTransitionTypes("/weekly", "/")).toEqual(["nav-back"]);
    expect(getNavTransitionTypes("/scoreboard/game/401", "/scoreboard")).toEqual(["nav-back"]);
  });

  it("fades between same-depth pages", () => {
    expect(getNavTransitionTypes("/weekly", "/overall")).toEqual(["nav-fade"]);
  });

  it("adds nothing when only the query changes", () => {
    expect(getNavTransitionTypes("/weekly", "/weekly?week=4")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd apps/web && npx vitest run src/lib/navTransition.test.ts`
Expected: FAIL, cannot resolve `./navTransition`.

- [ ] **Step 3: Implement**

```ts
export type NavTransitionType = "nav-back" | "nav-forward" | "nav-fade";

const stripQuery = (href: string): string => href.split("?")[0] ?? href;

// Dashboard is the root; a game page sits under the scoreboard; every other page is a top-level destination
export const navDepth = (pathname: string): number => {
  const path = stripQuery(pathname);

  if (path === "/") return 0;
  if (path.startsWith("/scoreboard/game/")) return 2;

  return 1;
};

export const getNavTransitionTypes = (fromPathname: string, toHref: string): NavTransitionType[] => {
  const from = stripQuery(fromPathname);
  const to = stripQuery(toHref);

  if (from === to) return [];

  const fromDepth = navDepth(from);
  const toDepth = navDepth(to);

  if (toDepth > fromDepth) return ["nav-forward"];
  if (toDepth < fromDepth) return ["nav-back"];

  return ["nav-fade"];
};
```

- [ ] **Step 4: Run to verify pass**

Run: `cd apps/web && npx vitest run src/lib/navTransition.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/navTransition.ts apps/web/src/lib/navTransition.test.ts
git commit -m "Add pure navigation-direction helper for view transition types"
```

---

### Task 2: Attach transition types to every navigation

**Files:**
- Modify: `apps/web/src/components/WeekLink/WeekLink.tsx`
- Modify: `apps/web/src/components/NavLink/NavLink.tsx`
- Modify: `apps/web/src/components/CommandMenu/CommandMenu.client.tsx:253-258`
- Modify: `apps/web/src/components/GameDetailsLink/GameDetailsLink.tsx`, `apps/web/src/components/LiveGameStrip/LiveGameStrip.tsx:132-144`

**Interfaces:**
- Consumes: `getNavTransitionTypes` from Task 1
- Produces: `WeekLink` accepts `transitionTypes?: string[]` (explicit wins; omitted means derived from `usePathname()`)

- [ ] **Step 1: WeekLink derives types**

In `WeekLink.tsx` add `import { usePathname } from "next/navigation";` and `import { getNavTransitionTypes } from "@/lib/navTransition";`, then replace the component body:

```tsx
export const WeekLink: FC<WeekLinkProps> = ({ children, href, preserveWeek = true, transitionTypes, ...rest }) => {
  const [week] = useQueryState("week", weekParser);
  const pathname = usePathname();
  const resolvedHref = preserveWeek ? appendWeekIfMissing(href, week) : href;

  return (
    <Link href={resolvedHref} transitionTypes={transitionTypes ?? getNavTransitionTypes(pathname, resolvedHref)} {...rest}>
      {children}
      <PendingMarker />
    </Link>
  );
};
```

- [ ] **Step 2: Sidebar links are tab switches**

In `NavLink.tsx`, add `transitionTypes={["nav-fade"]}` to the `<WeekLink>`.

- [ ] **Step 3: Command menu**

```tsx
    startTransition(() => {
      router.push(withWeek(href, week), { transitionTypes: ["nav-fade"] });
    });
```

- [ ] **Step 4: Remaining raw links**

Read `LiveGameStrip.tsx:125-146`. In both it and `GameDetailsLink.tsx`, replace `import Link from "next/link"` with `import { WeekLink } from "../WeekLink/WeekLink"`, rename `<Link` to `<WeekLink`, add `preserveWeek={false}` (the href already carries `?week=`), and cast the href with `as Route` (`import type { Route } from "next"`) since typedRoutes rejects the template string.

- [ ] **Step 5: Verify**

Run: `npm run typecheck && npm run lint`
Expected: PASS. Then `npm run dev`, open `/`, click "View Details" under Weekly Rank: page should slide forward; click "Back to Dashboard" (mobile width): slides back; sidebar `/weekly` to `/overall`: no slide yet (Task 3 adds the fade).

- [ ] **Step 6: Commit**

```bash
git add -A apps/web/src
git commit -m "Give every link and command-menu navigation a view transition type"
```

---

### Task 3: Animations for the new types

**Files:**
- Modify: `apps/web/src/components/ViewTransitions/PageTransition.tsx`
- Modify: `apps/web/src/app/globals.css` (`:root` tokens near line 43; transition rules near line 310-360)

**Interfaces:**
- Consumes: type name `nav-fade` from Task 1
- Produces: CSS classes `nav-fade`, `morph`; tokens `--ease-out-quint`, `--ease-in-out-quint` (used by Task 4)

- [ ] **Step 1: PageTransition maps `nav-fade`**

```tsx
const directionalSlide = {
  default: "none",
  "nav-back": "nav-back",
  "nav-fade": "nav-fade",
  "nav-forward": "nav-forward",
} as const;
```

- [ ] **Step 2: CSS**

After `--duration-move: 400ms;` add:

```css
  --ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out-quint: cubic-bezier(0.83, 0, 0.17, 1);
```

Replace the four `nav-forward`/`nav-back` rules' `ease-in-out` with `var(--ease-in-out-quint)` and the `ease-out`/`ease-in` fades unchanged. Add after them:

```css
::view-transition-old(.nav-fade) {
  animation: var(--duration-exit) ease-in both fade reverse;
}

::view-transition-new(.nav-fade) {
  animation: var(--duration-enter) ease-out var(--duration-exit) both fade;
}

::view-transition-group(.morph) {
  animation-duration: var(--duration-move);
  animation-timing-function: var(--ease-in-out-quint);
}
```

- [ ] **Step 3: Verify in browser**

`npm run dev`: sidebar Weekly to Overall crossfades (no slide); `/` to `/weekly` slides; reduced-motion (DevTools rendering emulation) disables both.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/ViewTransitions/PageTransition.tsx apps/web/src/app/globals.css
git commit -m "Add crossfade for tab navigation and shared easing tokens to view transitions"
```

---

### Task 4: Shared-element morph, weekly (desktop) end to end

This is the risky task: it proves the pair forms across a suspending route. Do it fully for weekly before replicating.

**Files:**
- Create: `apps/web/src/components/ViewTransitions/SharedElement.tsx`
- Modify: `RankingPieChart.tsx`, `ProgressChart.tsx`, `WeeklyDashboard.client.tsx`, `WeeklyDashboard.tsx:74-90`, `app/weekly/page.tsx:151,180,188`, `app/weekly/loading.tsx`

**Interfaces:**
- Produces: `SharedElement` props `{ name: string; children: ReactNode }`. Chart components rename prop `layoutId` to `transitionName: string`. Title components wrap their `<h2>` in `SharedElement`.

- [ ] **Step 1: SharedElement**

```tsx
import { type FC, type ReactNode, ViewTransition } from "react";

type SharedElementProps = {
  children: ReactNode;
  name: string;
};

// share="morph" must stay alongside default="none", or the named pair silently stops morphing
const SharedElement: FC<SharedElementProps> = ({ children, name }) => (
  <ViewTransition default="none" name={name} share="morph">
    {children}
  </ViewTransition>
);

export default SharedElement;
```

- [ ] **Step 2: Charts and titles**

`RankingPieChart`: remove the `framer-motion` import; replace `<m.div className="min-h-[206px] w-full" layoutId={layoutId}>` with `<SharedElement name={transitionName}><div className="min-h-[206px] w-full">` and close both; rename the prop type and destructure. Same shape for `ProgressChart` (`<m.div layoutId={layoutId}>` to `<SharedElement name={transitionName}><div>`). In `WeeklyDashboard.client.tsx` replace each `m.h2 ... layoutId="x"` with `<SharedElement name="x"><h2 ...>...</h2></SharedElement>` and drop the import. Update the three call sites in `WeeklyDashboard.tsx` and the three in `app/weekly/page.tsx` to `transitionName=`.

- [ ] **Step 3: Spike in browser (desktop width, ≥768px)**

`npm run dev`, open `/`, click "View Details" on Weekly Rank. Expected: pie and progress bars glide to their `/weekly` spots; "Back to Dashboard" equivalent (sidebar Dashboard) glides back.

- [ ] **Step 4: If no morph forms (expected: the fallback and the `dynamic()` chart import break pairing)**

Read `app/weekly/loading.tsx` and `components/WeeklyDashboard/DashboardLoader.tsx`. Give each loading skeleton the same named wrapper at the same slot so a pair forms with the dashboard's real chart:

```tsx
<SharedElement name="weeklyRankingPieChart">
  <div className="min-h-[206px] w-full" />
</SharedElement>
```

(and `weeklyPointsEarned` / `weeklyGamesCorrect` placeholders of the progress-bar height). If the `dynamic(() => import("../RankingPieChart/RankingPieChart"))` in `WeeklyDashboard.tsx` still prevents the pair, replace it with a static import. Re-run Step 3. If the morph still cannot be made to pair after both fixes, stop and report with a screen recording; do not paper over it.

- [ ] **Step 5: Verify + commit**

Run `npm run typecheck && npm run lint && npm run test`. Check console clean.

```bash
git add -A apps/web/src
git commit -m "Morph the weekly dashboard charts and titles into the weekly page with view transitions"
```

---

### Task 5: Same treatment for overall, survivor, scenarios

**Files:**
- Modify: `OverallDashboard.tsx`, `OverallDashboard.client.tsx`, `app/overall/page.tsx:142,161,169`, `app/overall/loading.tsx`, `SurvivorDashboard*`, `app/survivor/view/page.tsx:188,196` (+ its loading file), `ScenariosDashboard.client.tsx`

- [ ] **Step 1:** Apply Task 4 Steps 2 and 4 to each pair. Names stay as they are today (`overallRankingPieChart`, `overallPointsEarned`, `overallGamesCorrect`, `overallRankTitle`, `survivorWeekStatus`, `survivorOverallStatus`, `scenarioTitle`, `myWeeklyResultsTitle`). Verify each name is rendered at most once per page (dashboard `/` renders weekly, overall and survivor names once each).
- [ ] **Step 2:** Browser check: `/` to `/overall`, `/` to `/survivor/view` and back, both directions.
- [ ] **Step 3:** `npm run typecheck && npm run lint && npm run test`
- [ ] **Step 4: Commit**

```bash
git add -A apps/web/src
git commit -m "Morph the overall, survivor and scenarios dashboard elements into their detail pages"
```

---

### Task 6: Remove framer-motion (GATE: ask the user first)

**Files:**
- Modify: `apps/web/src/components/Providers/providers.tsx`, `apps/web/package.json`, `pnpm-lock.yaml`

- [ ] **Step 1:** Confirm `grep -rn framer-motion apps packages --include='*.ts' --include='*.tsx' -l | grep -v node_modules` returns only `providers.tsx`. If anything else shows up, stop.
- [ ] **Step 2:** Ask the user: "OK to remove the framer-motion dependency?" Do not proceed without yes.
- [ ] **Step 3:** Remove the `LazyMotion` and `MotionConfig` wrappers and import from `providers.tsx`; `cd apps/web && pnpm remove framer-motion`.
- [ ] **Step 4:** `npm run prepush`. Expected: green (knip clean, build passes).
- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Remove framer-motion now that view transitions handle every shared-element animation"
```

---

### Task 7: Full verification

- [ ] **Step 1:** `npm run prepush` green.
- [ ] **Step 2:** Browser pass (desktop Chrome and Safari, plus a 390px-wide viewport), record route, action, expected vs actual:
  - `/` to `/weekly`, `/overall`, `/survivor/view` and back (morph on desktop, slide on mobile width)
  - Sidebar tab switches (crossfade, nav stays pinned)
  - Scoreboard to a game page and back (push/pop)
  - Week arrows (existing directional slide still works, not overridden)
  - Browser back button (no double animation)
  - Reduced motion on (no motion)
  - Console and network clean; page interactive during transitions
- [ ] **Step 3:** Hand to the user for iPhone PWA testing; note edge-swipe-back behavior is the open risk.

## Self-review (spec coverage)

- Nav model: Tasks 1-2. Sidebar/command menu fade is a deliberate refinement of the spec (tab semantics).
- Popstate: no type attached, `PageTransition` default is `none`, so no double animation (Task 7 checks it).
- Shared elements + Suspense: Tasks 4-5, skeleton fix is concrete with a stop condition.
- Timing tokens, reduced motion: Task 3 (existing reduced-motion rule retained).
- framer-motion removal with approval gate: Task 6.
- Mobile caveat (charts hidden below md): morphs are desktop-only by layout; phones get slides.
