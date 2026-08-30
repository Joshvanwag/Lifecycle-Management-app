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
| Server clients | `@supabase/ssr` (cookie sessions) and `@supabase/server` (header/JWT verification) |
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

Complete. Application shell, documentation, and demo UI.

## Phase 2 Status

Complete. Supabase schema, RLS, auth, and live Overview/Spaces reads.

## Phase 3 Status

Complete. Lifecycle engine, compound-inflation forecasts, planning edits, and in-app Add Space / Full Refresh / Partial Refresh / Correct Inventory.

## Phase 4 Status

Complete. CSV/Excel import for the four lifecycle workflows, auto column mapping, reusable mappings, and session-scoped writes (RLS). Forecast / Capital Plan / Reports pages remain Phase 5.
