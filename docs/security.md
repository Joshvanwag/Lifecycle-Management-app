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

### Invitation-only onboarding

Users **cannot** self-provision organizations. New accounts are created only through a valid organization invitation:

1. A platform administrator creates the organization and sends an owner invitation, or an organization owner/admin invites a team member.
2. The invitee opens `/signup?invite=<token>` and creates an account with the invited email address.
3. The `handle_new_user` trigger (or `accept_pending_invitations()` on sign-in) links the auth user to the invited organization via `organization_memberships`.

Users who sign up without a valid invitation receive an auth account but **no organization membership** and cannot access the dashboard.

Direct INSERT into `organizations` or self-assigned memberships are blocked by RLS. Organization creation uses the service role from platform admin server actions only.

### Platform administrators

Platform admin status is stored in **`auth.users.raw_app_meta_data.platform_admin`** (server-set only, never `user_metadata`).

Platform administrators can:
- View and switch between all organizations
- Read/write all tenant data (cross-tenant support access)
- Create organizations and invitations
- Call `get_benchmark_metrics_admin()` to inspect sub-threshold benchmark aggregates including `contributor_count`

**Customer organization owners retain the standard under-5 benchmark rule** via `get_benchmark_metrics_public()`. The contributor threshold bypass applies only to platform administrators.

Grant platform admin access with:

```bash
npm run admin:grant-platform -- user@example.com
```

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
| `can_manage_organization(uuid)` | Role is owner or admin, or caller is platform admin |
| `is_platform_admin()` | Reads `app_metadata.platform_admin` from JWT |

### Policy pattern

- **SELECT:** `organization_id in (select user_organization_ids())`
- **INSERT/UPDATE/DELETE (data tables):** `can_write_organization(organization_id)`
- **Organization update:** `can_manage_organization(id)`
- **Membership management:** `can_manage_organization(organization_id)`

Organization inserts are not exposed to authenticated clients; new organizations are created by platform administrators via service-role server actions.

Migrations: `supabase/migrations/20250829180001_rls_policies.sql`, `supabase/migrations/20250829210000_invitation_only_platform_admin.sql`

## Benchmarking Security (Phase 2)

Benchmarking must **not** weaken tenant isolation on operational tables.

### Architecture

```
Tenant operational tables (RLS per organization)
        ↓
Service-role aggregation pipeline (trusted boundary)
        ↓
benchmark_aggregate_metrics (anonymous, internal)
        ↓
get_benchmark_metrics_public() (reciprocity + eligibility)
        ↓
Customer application
```

Tenants **never** receive SELECT access to another organization's Spaces, Assets, or other operational rows for benchmarking purposes.

### Benchmark-specific tables

| Table / Function | Client access |
| --- | --- |
| `industry_types` | SELECT active rows (signup/settings) |
| `benchmark_metrics` | SELECT active catalog |
| `benchmark_system_settings` | **No client access** (service role only) |
| `organization_benchmark_values` | SELECT own organization only |
| `benchmark_aggregate_metrics` | **No direct client access** |
| `get_benchmark_metrics_public()` | SELECT eligible aggregates if participating |

### Reciprocity

`user_can_access_benchmarks(industry_type)` returns true only when the caller belongs to an organization where:

- `benchmark_participation = true`
- `industry_type` matches the requested benchmark cohort

Organizations that opt out stop contributing **and** lose benchmark read access.

### Threshold enforcement

`benchmark_aggregate_metrics.contributor_count` is internal. Only rows with `is_eligible = true` (count ≥ `min_contributor_threshold`) are returned by the public RPC. Sub-threshold counts are never disclosed.

### Prohibited benchmark disclosures

Never expose in customer-facing benchmark output: organization names, location identifiers, space/asset names, network identifiers, serial numbers, user PII, individual tenant values, source organization UUIDs, or contributor counts.

Migrations: `supabase/migrations/20250829190000_benchmarking_foundation.sql`, `supabase/migrations/20250829190001_benchmarking_rls.sql`

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
