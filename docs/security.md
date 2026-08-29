# Security

## Principles

1. Tenant isolation enforced at the database layer via Row Level Security
2. Never trust client-provided organization_id or role claims
3. Never expose Supabase service role key to the browser
4. Never commit secrets to source control
5. Design for future compliance (SOC 2, MFA, SSO) without over-engineering initial build

## Authentication

Supabase Auth provides:
- Email/password (default)
- MFA
- Enterprise SSO (optional per organization)

User's authenticated identity determines accessible organization(s).

On signup, a database trigger (`handle_new_user`) creates:
- One `organizations` row (name from signup metadata)
- One `organization_memberships` row with role `owner`

Dashboard routes are protected by Next.js middleware. Unauthenticated users are redirected to `/login`.

## Authorization

Initial roles: `owner`, `admin`, `member`, `read_only`.

### MVP role matrix (Phase 2)

| Action | owner | admin | member | read_only |
| --- | --- | --- | --- | --- |
| Read organization data | Yes | Yes | Yes | Yes |
| Insert/update/delete tenant data | Yes | Yes | Yes | No |
| Update organization settings | Yes | Yes | No | No |
| Manage memberships | Yes | Yes | No | No |

Write restrictions are enforced in RLS via `can_write_organization()` and `can_manage_organization()` helper functions.

Future granular permissions (imports, exports, lifecycle edits) are deferred to later phases.

## Row Level Security (Phase 2)

RLS is enabled on all tenant-owned tables:

- `organizations`
- `organization_memberships`
- `campuses`, `buildings`, `floors`, `physical_locations`
- `spaces`, `space_locations`
- `assets`
- `forecast_cost_components`
- `refresh_events`

### Helper functions

| Function | Purpose |
| --- | --- |
| `user_organization_ids()` | Returns organization IDs for `auth.uid()` |
| `can_read_organization(uuid)` | Membership exists |
| `can_write_organization(uuid)` | Role is owner, admin, or member |
| `can_manage_organization(uuid)` | Role is owner or admin |

### Policy pattern

- **SELECT:** `organization_id in (select user_organization_ids())`
- **INSERT/UPDATE/DELETE (data tables):** `can_write_organization(organization_id)`
- **Organization update:** `can_manage_organization(id)`
- **Membership management:** `can_manage_organization(organization_id)`

Organization inserts are not exposed to authenticated clients; signup uses the `handle_new_user` security-definer trigger.

Migrations: `supabase/migrations/20250829180001_rls_policies.sql`

## Environment Variables

| Variable | Exposure | Purpose |
|----------|----------|---------|
| `SUPABASE_URL` | Server | Project URL for `@supabase/server` |
| `SUPABASE_PUBLISHABLE_KEY` | Server (also mirrored as `NEXT_PUBLIC_*`) | New publishable API key |
| `SUPABASE_SECRET_KEY` | Server-only | New secret API key for admin / privileged operations |
| `SUPABASE_JWKS_URL` | Server-only | JWKS endpoint for JWT verification |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-safe | Supabase project URL for Next.js clients |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe | Publishable key for `@supabase/ssr` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe | Alias for the publishable (or legacy anon) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Legacy alias for `SUPABASE_SECRET_KEY` |

## Server-Side Operations

Privileged operations use Next.js server components/actions with the authenticated user's session (RLS enforced) or, when required, the service role client:

- Demo seed script (`npm run db:seed`) — service role only, never in browser
- Future: bulk imports, admin functions, exports

## Audit Logging (Future)

Administrative audit events (separate from lifecycle history):
- User invited / role changed
- Import completed
- Export performed
- Lifecycle defaults changed
- SSO settings changed

Do not log every page view.
