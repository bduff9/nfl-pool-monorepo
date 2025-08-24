# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Repository Overview

This is an NFL confidence pool application built as a TypeScript monorepo using Turbo. The system manages an NFL prediction pool where users make weekly picks with confidence points and includes a survivor pool variant.

### Architecture

**Monorepo Structure:**
- **apps/web**: Next.js 15 frontend application with App Router
- **apps/cron**: AWS CDK infrastructure for Lambda functions and scheduled tasks
- **packages/**: Shared libraries and utilities

**Core Packages:**
- **db**: Database layer using Kysely ORM with MySQL, includes migrations and materialized views
- **api**: Shared API utilities and data fetching logic
- **ui**: Shared React components built with shadcn/ui and Tailwind CSS
- **transactional**: Email templates and transactional messaging
- **utils**: Common utilities, constants, and type definitions
- **types**: Shared TypeScript type definitions
- **tsconfig**: Shared TypeScript configurations

### Database Design

The application uses MySQL with a complex schema supporting:
- **Games & Teams**: NFL game data with real-time score updates
- **Picks**: User confidence picks (1-N points per week)  
- **Survivor Picks**: Elimination-style survivor pool picks
- **Materialized Views**: Performance-optimized views (OverallMV, WeeklyMV, SurvivorMV)
- **User Management**: Authentication, payments, notifications

**Key Entities:**
- Users make Picks for Games with PickPoints (confidence levels)
- SurvivorPicks track elimination pool selections
- Materialized views calculate standings and rankings
- Games track live NFL data (scores, status, winner)

## Common Development Commands

### Project Setup
```bash
npm run setup              # Install dependencies and sync types
npm i                      # Install all dependencies
```

### Development
```bash
npm run dev                # Start all development servers
npm run build              # Build all packages and apps
npm run clean              # Clean all build artifacts
```

### Code Quality
```bash
npm run lint               # Lint all packages (Biome)
npm run lint:fix           # Auto-fix linting issues
npm run format             # Format code
npm run format:fix         # Auto-format code
npm run typecheck          # Type check all packages
```

### Database Operations
```bash
# In packages/db
npm run db:migrate         # Run migrations and regenerate types
npm run db:generate --     # Generate new migration (add name)
npm run codegen            # Regenerate database types from schema
npm run db:downgrade       # Rollback last migration
npm run db:migrate:prod    # Production migrations (no codegen)
```

### Web App (apps/web)
```bash
npm run dev                # Next.js dev server with Turbopack
npm run build              # Production build with Turbopack
npm run start              # Start production server
npm run typecheck          # Generate Next.js types + TypeScript check
```

### CDK Infrastructure (apps/cron)
```bash
cdk synth                  # Generate CloudFormation templates
cdk deploy CdkStackDev     # Deploy to development
cdk deploy CdkStackProd    # Deploy to production

# Local Lambda testing
cdk synth --no-staging
sam local invoke CurrentWeekUpdaterLocal --no-event -t ./cdk.out/CdkStackLocal.template.json
```

### UI Components
```bash
# In packages/ui or apps/web
npm run add-shadcn-component -- button   # Add new shadcn component
```

## Key Development Patterns

### Database Access
- All database operations use Kysely ORM
- Materialized views (OverallMV, WeeklyMV, SurvivorMV) are updated via complex SQL stored in mutation files
- Database transactions are used for data consistency
- Type-safe queries with auto-generated types from schema

### API Integration  
- External NFL API data is validated and "healed" to maintain data consistency
- Game healing logic handles schedule changes and data discrepancies
- Pick healing ensures user confidence points remain valid when games change

### Authentication & Sessions
- Custom session management with database-stored sessions
- OAuth integration for Google authentication
- Server-side session validation for protected routes

### Performance Optimizations
- Materialized views for complex ranking calculations
- React Query for client-side caching
- Turbopack for faster builds and development
- Database indexes on frequently queried columns

### Error Handling
- ZSA (Zod Server Actions) for type-safe server actions
- Custom error types and consistent error handling
- Sentry integration for error tracking

### Deployment Architecture
- Next.js app likely deployed to Vercel (inferred from configuration)
- AWS Lambda functions for cron jobs and background tasks
- MySQL database (production location not specified in codebase)
- CDK for infrastructure as code

## Testing Strategy

While specific test files weren't found, the codebase includes:
- Jest configuration in CDK app for Lambda function testing
- Type checking as a form of compile-time testing
- Database transaction rollback patterns for safe operations

The healing and validation logic suggests this is a production system that handles real-time NFL data with data integrity being critical.
