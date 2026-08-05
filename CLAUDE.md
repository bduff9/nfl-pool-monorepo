# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

NFL confidence pool application: a TypeScript monorepo (pnpm workspaces + Turbo) where users make weekly picks with confidence points, plus a survivor-pool variant.

## Common Development Commands

Run all commands from repo root unless noted; Turbo fans them out to workspaces.

```bash
pnpm install                # install deps
npm run setup               # typesync + pnpm install

npm run dev                 # start all dev servers (persistent, uncached)
npm run build               # build all packages/apps
npm run clean               # clean build artifacts

npm run lint                # Biome check across all packages
npm run lint:fix            # auto-fix lint issues
npm run format / format:fix # Biome format

npm run typecheck           # tsgo --noEmit per package (fast, cached)
npm run typecheck:tsc       # tsc --noEmit per package (fallback/authoritative)

npm run test                # vitest run, per package
npm run prepush             # knip + lint + typecheck + test, streamed & parallel — run before pushing
```

Run a single test: `cd packages/<pkg-or-app> && npx vitest run path/to/file.test.ts` (each package/app has its own `vitest.config.ts` with `environment: "node"`, `include: ["src/**/*.test.ts"]`, `passWithNoTests: false`).

Run a single workspace's task via Turbo filter: `turbo test --filter=@nfl-pool-monorepo/db` (root `package.json` name is `web` for apps/web, `@nfl-pool-monorepo/<name>` for everything else — check each `package.json`).

### Database (packages/db)

```bash
npm run db:migrate          # kysely migrate latest + regenerate types (dev)
npm run db:migrate:prod     # migrate only, no codegen (prod)
npm run db:downgrade        # rollback last migration
npm run db:generate -- <name>   # create new migration file
npm run codegen             # regenerate ./src/index.ts types from live schema via kysely-codegen
```

Local MySQL for dev: `docker-compose up` (mysql:8.0.26, db `NFL`, seeded from `./init-db`).

### Web app (apps/web)

```bash
npm run dev                 # Next.js dev server (Turbopack)
npm run build / start
npm run typecheck           # next typegen && tsgo --noEmit
npm run add-shadcn-component -- button   # add a new shadcn/ui component
```

### CDK infra (apps/cron)

```bash
cdk synth
cdk deploy CdkStackDev
cdk deploy CdkStackProd

# local Lambda testing
cdk synth --no-staging
sam local invoke CurrentWeekUpdaterLocal --no-event -t ./cdk.out/CdkStackLocal.template.json
```

3 environments: local (SAM only), dev, prod — see `apps/cron/lib/cdk-stack-{local,dev,prod}.ts`.

## Architecture

**Apps:**
- `apps/web` — Next.js 16 (App Router, Turbopack) frontend/backend for the pool.
- `apps/cron` — AWS CDK app; Lambda functions for scheduled jobs (`apps/cron/functions/`: `currentWeekUpdater`, `futureGameUpdater`, `liveGameUpdater`, `backupNflDatabase`, `resetPool`).

**Packages** (`@nfl-pool-monorepo/*`, consumed via `workspace:*`):
- `db` — Kysely ORM over MySQL. `src/queries/*` (reads) and `src/mutations/*` (writes) are split per entity; `src/index.ts` is the auto-generated schema type file (regenerate with `codegen`, never hand-edit); migrations live in `migrations/`, timestamp-prefixed.
- `api` — external NFL API integration: fetching, validation (`validation.ts`), and "healing" logic (`healing.ts`) that reconciles schedule changes / data discrepancies against stored games and picks.
- `ui` — shared React components (shadcn/ui + Tailwind v4).
- `transactional` — email templates, push notifications, SMS.
- `utils` — shared constants, date/number helpers, validation schemas.
- `types` — shared TypeScript types.
- `tsconfig` — shared base tsconfig variants (`base`, `next`, `ui`, `utils`, `types`).

**apps/web internal structure** (`apps/web/src/`):
- `app/` — Next.js App Router routes (`admin`, `login`, `overall`, `picks`, `quick-pick`, `scoreboard`, `survivor`, `users`, `weekly`, `support`, `auth`, `api`).
- `server/actions/` — server actions per entity (pick, survivor, payment, user, week, tiebreaker, etc.) — these are the mutation entry points from the client.
- `server/loaders/` — server-side data loaders per entity, including materialized-view loaders (`overallMv`, `survivorMv`, `weeklyMv`) and `param-parsing.ts` for URL/search-param parsing.
- `components/` — one directory per component (PascalCase), UI feature components (dashboards, picks, admin tables) distinct from the shared `packages/ui`.

**Data model essentials:**
- Users make Picks per Game with PickPoints (confidence values); SurvivorPicks track elimination-pool selections separately.
- Materialized views (`OverallMV`, `WeeklyMV`, `SurvivorMV`) precompute standings/rankings — updated via mutation functions in `packages/db/src/mutations/{overallMv,survivorMv,weeklyMv}.ts`, not recomputed ad hoc on read.
- Game "healing" (`packages/api/src/healing.ts`) keeps games and dependent picks consistent when the upstream NFL schedule changes mid-season.

**Auth:** custom DB-backed session management (not a third-party auth library) plus Google OAuth; sessions validated server-side for protected routes.

**Error handling:** ZSA (Zod Server Actions) for typed server actions; Sentry for error tracking.

## Engineering principles

When multiple implementations satisfy the requirements:

1. Prefer established repository patterns over introducing new ones.
2. Prefer explicit, readable code over clever abstractions.
3. Minimize future maintenance cost, not merely line count.
4. Keep diffs as small and focused as possible while solving the problem cleanly.
5. Do not refactor unrelated code unless explicitly asked or required for correctness.
6. Every new abstraction, dependency, shared utility, or generalized component must justify its maintenance cost.
7. Preserve existing behavior unless explicitly asked to change it.

## Before coding & decision boundaries

Before modifying code: read existing implementations of similar behavior, identify the minimum files likely required, and state important assumptions/risks/edge cases before writing.

Decide independently when the choice is local, reversible, and consistent with existing patterns — naming local variables/helpers, small extraction within task scope, test structure using existing conventions, minor readability improvements in lines already being touched.

Stop and ask before:

- editing `packages/db/migrations/**` or the Kysely schema, or hand-editing `packages/db/src/index.ts` (generated — regenerate with `codegen` instead)
- introducing or replacing a dependency
- changing authentication, session, or authorization behavior
- changing a server action's public contract, a shared type in `packages/types`, or cross-package API shape
- changing materialized-view calculation logic (`OverallMV`/`WeeklyMV`/`SurvivorMV`) or pick/survivor-pick persistence semantics
- changing game "healing" logic (`packages/api/src/healing.ts`) — it reconciles live NFL data and is easy to silently break
- broad refactoring or moving unrelated code
- a risky CDK/infra change to `apps/cron/lib/cdk-stack-prod.ts` or a prod deploy
- tests failing for reasons unrelated to the current task
- `npm run prepush` failures that can't be resolved safely

## Verification gates

- `npm run prepush` (knip + lint + typecheck + test, streamed & parallel) is the full verification command — run it early and often while implementing, not just at the end.
- If `prepush` fails, fix everything it reports and re-run until green.
- For UI changes in `apps/web`, `prepush` alone isn't sufficient — verify in a real browser (see below).
- Never bypass hooks with `--no-verify`, skip signing with `--no-gpg-sign`, or force-push, unless explicitly asked.
- Never run destructive DB or git operations (migration rollback against prod, `git reset --hard`, `rm -rf`) without confirming first — this applies even when confident.

## Browser verification for UI changes (apps/web)

Any change affecting what users see or interact with needs real browser verification, not just type checking or tests. Drive the actual flow (`npm run dev`, then click through it) and check:

- the primary happy path and relevant validation/error paths
- loading, disabled, empty, and success states affected by the change
- role/permission variants affected (e.g. admin vs regular user)
- browser console errors and failed/unexpected network requests
- persistence after refresh, for anything that writes data
- no obvious regressions in nearby behavior touched by the same code

Report verification results (route, actions taken, expected vs actual, any console/network issues) rather than only claiming tests pass.

## Code Style

- Biome is the linter/formatter for the whole repo (root `biome.jsonc`, per-package overrides). Key non-default rules already enabled: `noDefaultExport` off, `noImplicitBoolean` off, `useNamingConvention` off, `noConsole` off — don't fight these by adding suppressions elsewhere.
- Import order is enforced via Biome's `organizeImports` groups (URL → Bun → Node → package → aliased package → path), each group blank-line separated — let `lint:fix`/`format:fix` handle ordering rather than hand-sorting.
- Line width 120, LF line endings, space indentation.
- Function expressions (`const fn = (...) => {}`) are the dominant style throughout the codebase, including exported functions — prefer them over `function` declarations unless matching an existing exception nearby.
- One blank line between grouped `const`/`let` declarations and the next statement/block; collapse multiple blank lines into one.
- No barrel/re-export-only `index.ts` files. The few existing `packages/*/src/index.ts` files are real entry-point modules (or, for `packages/db`, generated schema types) — not re-export barrels.
- When modifying code, write complete functions — no placeholders like `// rest of code here`.
