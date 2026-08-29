# Architecture

## Principles

1. Keep the architecture simple
2. Use Supabase heavily rather than recreating existing features
3. Security and tenant isolation designed correctly from the beginning
4. Never rely on frontend filtering for tenant security
5. Prefer server-side Next.js for privileged operations

## Technology Stack

| Layer | Technology |
|-------|------------|
| Application | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, MFA, SSO, RLS) |
| Hosting | AWS Amplify (planned, not yet configured) |
| Source Control | Git, GitHub |

## Deliberately Excluded (Initial)

- Separate NestJS backend
- Docker for production
- Kubernetes
- Redis
- Microservices
- GitHub Actions
- Playwright / Vitest
- Sentry / Vanta
- Terraform (may be added later)

## Application Structure

```
Browser
  └── Next.js App (App Router)
        ├── Server Components / Server Actions (privileged operations)
        ├── Client Components (interactive UI)
        └── Supabase Client (anon key, RLS-enforced)
              └── PostgreSQL + RLS policies
```

## Multi-Tenancy

- One organization = one tenant
- Every customer-owned record associated with `organization_id`
- User identity determines accessible organizations
- Row Level Security enforces tenant isolation at the database layer
- Service role key used only in server-side code for admin operations

## Server vs Client Responsibilities

**Server-side (Next.js):**
- Imports and bulk data processing
- Lifecycle updates (full/partial refresh)
- Financial calculations and forecasting
- Admin functions
- Exports

**Client-side:**
- Interactive UI
- Read operations via Supabase client (RLS-protected)
- Form input and navigation

## Deployment (Planned)

AWS Amplify will host the Next.js application. Supabase provides managed PostgreSQL and Auth. Environment variables configured per environment.

## Phase 1 Status

- Next.js application scaffolded at repository root
- UI shell with sidebar navigation
- Demo data for Overview and Spaces pages
- Supabase client utilities prepared (not yet connected)
- Migration directory structure created
- Documentation established

## Phase 2 Plan

- Supabase database schema
- Organizations, users, memberships
- Locations, Spaces, Assets
- Lifecycle defaults
- RLS policies
- Authentication flow
