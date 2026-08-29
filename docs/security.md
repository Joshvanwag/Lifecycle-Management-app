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

## Authorization

Initial roles: Owner, Admin, Member, Read Only.

Design permissions for future granularity:
- View/modify assets
- Import
- Run refresh
- Modify lifecycle assumptions
- Manage planning
- Export reports
- Manage users
- Manage organization settings
- View audit logs

## Row Level Security (Phase 2)

Every customer-owned table must have RLS policies ensuring:
- Users can only access data for organizations they belong to
- Role-based write restrictions where applicable
- No cross-tenant data leakage

RLS policies will be defined in Supabase migrations and documented here as they are implemented.

## Environment Variables

| Variable | Exposure | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-safe | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe | Public anon key (RLS enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Admin operations, imports |

## Server-Side Operations

Privileged operations use Next.js server components/actions with service role client:
- Bulk imports
- Lifecycle updates
- Financial calculations
- Admin functions
- Exports

## Audit Logging (Future)

Administrative audit events (separate from lifecycle history):
- User invited / role changed
- Import completed
- Export performed
- Lifecycle defaults changed
- SSO settings changed

Do not log every page view.

## Phase 1 Status

- Supabase client utilities created (`src/lib/supabase/`)
- Environment variable template in `.env.example`
- RLS policies not yet implemented (no database schema)
- No authentication UI yet
