# Native-feel screen transitions

## Problem

Screen transitions feel absent. The app already has React `<ViewTransition>` with `nav-back`/`nav-forward` slide CSS, but:

- Only the week-nav links in `SidebarWeekHeader` pass a transition type. Every other navigation (dashboard to detail, sidebar, back link, command menu) gets no slide.
- Charts and titles use framer-motion `layoutId` for shared-element morphs. `layoutId` only works inside one live React tree. Next unmounts the old route, so these have never animated across routes in the App Router. Dead code.

## Decisions (from brainstorming)

- Scope: full sweep (nav model + shared elements + consistent timing).
- Approach: React `<ViewTransition>` throughout. No `AnimatePresence`/layout shell.
- Platform: iOS PWA heaviest (~555 sessions/mo), desktop ~400, Android ~131. Native edge-swipe/predictive-back is left to the OS. No custom gesture.
- Remove `framer-motion` after the View Transition replacements are verified (needs explicit user OK for the dependency removal at that step).

## 1. Nav model

- `navDepth(pathname)`: pure, tested. `/` = 0; top-level destinations (`/weekly`, `/overall`, `/picks/*`, `/survivor/*`, `/scoreboard`, `/history`, `/head-to-head`, `/users/*`, `/support`, `/admin/*`) = 1; `/scoreboard/game/[eventId]` = 2.
- `TransitionLink` wraps `next/link`, sets `transitionTypes` by comparing `navDepth(current)` and `navDepth(href)`: deeper = `nav-forward`, shallower = `nav-back`, equal = `nav-fade`. Explicit week-nav types win. `WeekLink`, sidebar, back links and command menu route through it. A Biome rule bans raw `next/link` in `apps/web` once migrated.
- Programmatic navigation (`router.push` in the command menu) adds the same types via `addTransitionType` inside the transition.
- `popstate` (browser back, iOS edge-swipe, Android predictive back): no slide types, so we never double-animate over the OS animation. Verify on a real iPhone PWA.
- CSS: one token set (`--duration-*`, `--ease-*`). Push: outgoing page shifts ~30% and dims, incoming slides from the edge. `nav-fade`: short crossfade. Persistent nav/offline banner/toaster stay pinned (existing groups). `prefers-reduced-motion` disables animation (existing rule).

## 2. Shared elements and Suspense

- Replace each `m.div`/`m.h2` `layoutId` with a plain element inside `<ViewTransition name="...">`, reusing the existing ids as names (`weeklyRankingPieChart`, `weeklyPointsEarned`, `weeklyGamesCorrect`, `weeklyRankTitle`, `overall*`, `survivor*`, `scenarioTitle`). Dashboard card and detail page use the same name; names must be unique per rendered page, so a name appears once on each side only.
- Morph target must exist in both snapshots. Dashboard cards sit in `<Suspense>` with a skeleton, so the cached shell must render the real chart in the first committed frame, or the skeleton must carry the same named wrapper so the shape morphs and content fades in. Decide per page after measuring whether data is in the cached shell.
- Morph is symmetric: same names make forward (dashboard to detail) and back (detail to dashboard) morph.
- Respect `default="none"` on named transitions, so they only run on navigation, not on data revalidation.

## 3. Verification

- Unit tests: `navDepth`, direction resolution (pure function behind `TransitionLink`).
- `npm run prepush` green.
- Real-browser pass (CLAUDE.md UI rule): dashboard to weekly/overall/survivor and back, sidebar tab switches, scoreboard to game and back, browser back, week nav, reduced-motion on, console/network clean. Desktop Chrome and Safari; iPhone PWA left to the user.
- Last step: remove `framer-motion`, `LazyMotion`/`MotionConfig` from `providers.tsx`; run knip and lockfile update.

## Revisions after reading the code

- Sidebar and command-menu navigation are tab switches: always `nav-fade`. Only in-content links (`WeekLink` without explicit types) derive push/pop from `navDepth`.
- `router.push` takes `transitionTypes` natively; no custom wrapper.
- Morph pairs only form if the destination renders in the same commit. Loading skeletons (`loading.tsx`, `DashboardLoader`) must carry the same named wrapper, and `dynamic()` chart imports may need to become static.
- Chart panels on `/weekly` and `/overall` are `hidden md:inline-block`: morphs are desktop-only; phones get slides.

## Risks

- Safari/iOS View Transition quirks with fixed bars and z-index.
- Suspense timing vs. named-element snapshots.
- Double animation on OS back gestures.

## Out of scope

Custom interactive swipe-back, framer-motion in-page choreography (staggers, number tick-ups) — possible later polish layer.
