# Phase 2 Handoff Prompt

Use this document to onboard a new Cloud Agent or developer continuing work on the Lifecycle Management platform. Phase 1 is complete on `main`. Phase 2 begins here.

---

## Copy-Paste Prompt for New Cloud Agent

```
You are the senior software architect and lead engineer continuing work on a multi-tenant SaaS Lifecycle Management application.

## REPOSITORY STATUS

- **Repo:** https://github.com/Joshvanwag/Lifecycle-Management
- **Branch:** `main` (all Phase 1 work is merged here)
- **Also on remote:** `cursor/foundation-phase1-02cf` (same work, feature branch)
- **Do NOT** initialize a new Git repo or change the Git remote.

**Phase 1 is complete.** Your job is **Phase 2 only**. Read this entire prompt, then read `/docs` and `AGENTS.md` in the repo before implementing.

Also read `/docs/phase-2-handoff.md` in the repository for full context.

---

## PRODUCT PURPOSE

Lifecycle Management platform for universities/higher-ed AV equipment initially, but architecture must stay generic for AV, IT, lighting, security, networking, and other equipment categories.

**Core value:** Customers import equipment inventory, organize into **Spaces**, set lifecycle/refresh assumptions, forecast replacement costs with compound inflation, and plan capital budgets. Sophisticated underneath, simple on the surface.

---

## TECHNOLOGY STACK (DO NOT CHANGE)

| Layer | Technology |
|-------|------------|
| App | Next.js 15, React 19, TypeScript, App Router |
| Styling | Tailwind CSS 4, shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, MFA, SSO, RLS, migrations) |
| Hosting | AWS Amplify (planned — do NOT provision yet) |

**Do NOT add unless clearly necessary:** NestJS backend, Docker for production, Kubernetes, Redis, microservices, GitHub Actions, Playwright, Vitest, Sentry, Vanta, Terraform.

---

## ARCHITECTURAL PRINCIPLES (NON-NEGOTIABLE)

1. Keep architecture simple — use Supabase heavily
2. **Tenant isolation from day one** — one organization = one tenant
3. User identity determines accessible organization(s)
4. **Never rely on frontend filtering for security**
5. **PostgreSQL RLS must enforce tenant isolation**
6. Every customer-owned record must have `organization_id`
7. Never expose Supabase service-role key to browser
8. Prefer server-side Next.js for privileged ops (imports, lifecycle, calculations, admin, exports)
9. Do not invent business requirements — record ambiguities in `/docs/open-questions.md`
10. Use database migrations for all schema changes
11. Follow `AGENTS.md` — it is mandatory

---

## CORE DOMAIN CONCEPTS (from product spec)

### Space
Primary lifecycle object. NOT necessarily a physical room. User-facing term is always **"Space"** (not "AV System", "Managed Unit", etc.).

### Asset
Every physical equipment piece is its own record (even if identical, no serial, no cost). Immutable internal UUID. Optional fields: manufacturer, model/part number, category, serial, IP, MAC, PO, install date, cost.

### Cost model
Three valid scenarios per Space:
- **A.** Fully itemized (Space cost = sum of assets)
- **B.** Partially itemized
- **C.** Lump-sum Space cost with $0 per-asset costs (valid — do not force fake per-asset pricing)

### Defaults (configurable, do NOT hard-code in logic)
- Refresh cycle: **7 years**
- Inflation: **3.4%** compounded annually — `Future Value = Cost × (1 + rate) ^ years`

### Lifecycle vs Planning status (separate concepts)
- **Lifecycle:** Upcoming, Due, Overdue (Deferred is NOT lifecycle status)
- **Planning:** Unplanned, Scheduled, Deferred, Completed

### Critical lifecycle rules
- Spaces do NOT have to refresh all together — assets get independent schedules after partial replacement
- Never overwrite asset history — retire old, create new record
- Never rewrite historical actual costs when inflation assumptions change
- Four primary workflows (implement later, not Phase 2): Add New Spaces, Full Refresh, Partial Refresh, Correct Inventory

### Location model
Flexible hierarchy: Organization → Campus → Building → [optional Floor] → Physical Location. Floor disabled by default. Spaces ↔ locations are many-to-many. None required to create a Space.

---

## WHAT PHASE 1 COMPLETED (DO NOT REBUILD)

### Application scaffold
- Next.js 15 + TypeScript + Tailwind 4 at repo root
- ESLint + Prettier configured
- shadcn/ui components in `src/components/ui/`
- Supabase client utilities in `src/lib/supabase/` (client, server, admin, env) — **prepared but not connected**
- `.env.example` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### UI shell (polished, demo data)
- Left sidebar + top header + user menu placeholder
- Navigation: Overview, Spaces, Assets, Forecast, Capital Plan, Reports, Imports, Settings
- Global cursor rules (pointer on clickable, text cursor on inputs) in `src/app/globals.css`
- Filter pattern: search + Filters drawer + active filter chips (NOT top filter bar)

### Pages built (static demo data in `src/lib/demo-data.ts`)
| Route | Status |
|-------|--------|
| `/` Overview | Metrics cards, 5-year forecast chart (recharts), upcoming Spaces table |
| `/spaces` | Searchable table, filter drawer, clickable rows |
| `/spaces/[id]` | Header metrics, tabs (Overview/Assets/Lifecycle/History), Update Lifecycle dropdown |
| `/assets`, `/forecast`, `/capital-plan`, `/reports`, `/imports`, `/settings` | Placeholder "Coming soon" pages |

### Documentation (living — update when architecture changes)
```
/docs/product-spec.md
/docs/architecture.md
/docs/data-model.md
/docs/lifecycle-model.md
/docs/forecasting-model.md
/docs/import-model.md
/docs/security.md
/docs/ui-ux.md
/docs/open-questions.md
/docs/decisions.md
/docs/roadmap.md
AGENTS.md
```

### Supabase structure (empty — ready for migrations)
```
supabase/config.toml
supabase/migrations/.gitkeep
```

### Key files to know
```
src/lib/demo-data.ts       # Demo data — replace with Supabase queries in Phase 2
src/lib/types.ts           # TypeScript types (will evolve with schema)
src/config/navigation.ts   # Sidebar nav + lifecycle action menu items
src/components/layout/     # dashboard-shell, app-sidebar, app-header
src/components/spaces/     # spaces-table, space-filters, status-badges
src/components/overview/   # overview-dashboard, forecast-chart
```

### Git history on main
```
1734fd5 docs: add architecture documentation, AI rules, and Supabase structure
2c16a3b feat: add application shell, dashboard pages, and demo UI
487985b chore: scaffold Next.js application with Tailwind and tooling
82bc32f Create README.md
```

---

## PHASE 2 TASK — YOUR ASSIGNMENT

**Stop after Phase 2.** Do not proceed into lifecycle engine, imports, or forecasting.

### 1. Supabase connection
- Set up `.env.local` from `.env.example` (ask user for credentials if not available)
- Verify Supabase CLI / local dev workflow if appropriate
- Do NOT commit secrets

### 2. Database schema migrations
Create migrations in `supabase/migrations/` for (see `/docs/data-model.md` for details):

- **organizations** — name, default_refresh_cycle_years (7), default_inflation_rate (0.034), floors_enabled (false)
- **organization_memberships** — user_id, organization_id, role (owner/admin/member/read_only)
- **Location hierarchy:** campuses, buildings, floors (optional), physical_locations, space_locations (many-to-many)
- **spaces** — organization_id, name, space_type, commissioned_date, refresh_cycle_years, original_cost, planning_status, etc.
- **assets** — organization_id, space_id, manufacturer, model_number, category, serial_number, ip_address, mac_address, po_number, install_date, cost, status (active/retired), removed_date, refresh_cycle_years
- **forecast_cost_components** — asset-level and lump-sum forecasting (see `/docs/forecasting-model.md`)
- **refresh_events** — initial_deployment, full_refresh, partial_refresh, individual_replacement
- **organization defaults** stored on organizations table

Every customer-owned table MUST have `organization_id`.

### 3. Row Level Security
- RLS policies on ALL tenant tables
- Users can only access their organization's data
- Role-based write restrictions where appropriate
- Document policies in `/docs/security.md`
- Never bypass RLS as a shortcut

### 4. Authentication
- Sign up, sign in, sign out via Supabase Auth
- Protect dashboard routes — redirect unauthenticated users
- Organization context: resolve which org the user belongs to (single org for MVP; schema supports multi-org later)
- User menu in header should reflect real auth state

### 5. Wire UI to real data
- Replace `src/lib/demo-data.ts` usage on Overview, Spaces list, and Space detail with Supabase queries
- Server-side data fetching where appropriate
- Keep demo data file for reference or seed script, but pages should use live data
- Server-side pagination architecture for Spaces table (even if dataset is small initially)

### 6. Seed data (optional but helpful)
- Create a seed script or migration with sample organization + spaces matching current demo data for development

### 7. Documentation updates
- Update `/docs/security.md` with actual RLS policies
- Update `/docs/data-model.md` if schema differs from plan
- Update `/docs/roadmap.md` checkboxes for Phase 2
- Record decisions in `/docs/decisions.md`

---

## EXPLICITLY OUT OF SCOPE FOR PHASE 2

- Import workflows (CSV/Excel)
- Full/partial refresh logic
- Forecasting engine / compound inflation calculations
- Lifecycle status calculation engine
- AWS Amplify provisioning
- MFA / SSO configuration UI
- Custom report builder
- GitHub Actions / testing frameworks
- Rebuilding the UI shell or redesigning pages

---

## OPEN QUESTIONS (do not silently decide — see `/docs/open-questions.md`)

- Fiscal year vs calendar year for forecasting
- Single currency (USD) for MVP?
- Forecast pre-computation vs on-demand
- Exact RLS role matrix for MVP

If blocked, add to `/docs/open-questions.md` and implement the simplest valid approach.

---

## PRIORITY ORDER

1. Simple user experience
2. Correct data architecture
3. Tenant security
4. Accurate lifecycle forecasting (Phase 3+)
5. Maintainability
6. Speed of development

---

## DELIVERABLES FOR PHASE 2 COMPLETION

When done, report:
1. Summary of what was created
2. Migration files and schema overview
3. RLS policy summary
4. Auth flow description
5. Which pages now use live data vs demo data
6. Commands to run locally (including Supabase)
7. Environment variables needed
8. Open questions encountered
9. Git commits and push status
10. Recommended Phase 3 scope

---

## WORKFLOW

1. Clone/read repo from `main`
2. Read `/docs` and `AGENTS.md`
3. Ask for Supabase credentials if not in environment
4. Implement Phase 2 in logical commits
5. Push to `main` or a feature branch with PR
6. Stop and report — do NOT continue into Phase 3 automatically
```

---

## Quick Start for New Agent

1. Check out `main` from `Joshvanwag/Lifecycle-Management`
2. Read `AGENTS.md` and all files in `/docs`
3. Paste the prompt above (or point the agent at this file)
4. Provide Supabase credentials when asked
5. Agent implements Phase 2 only, then stops for review

## Phase Summary

| Phase | Status | Focus |
|-------|--------|-------|
| 1 | Complete | App shell, demo UI, documentation |
| 2 | Complete | Supabase schema, RLS, auth, live data |
| 3 | Complete | Lifecycle engine, forecasting, in-app refresh |
| 4 | **Next** | Import workflows |
| 4 | Planned | Import workflows |
| 5 | Planned | Reporting & planning |
| 6 | Planned | Enterprise features (MFA, SSO, exports) |
| 7 | Planned | Scale & polish |
