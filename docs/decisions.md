# Architecture Decisions

Record of significant decisions. Update when decisions change.

## ADR-001: Next.js App Router at Repository Root

**Date:** Phase 1  
**Status:** Accepted

Scaffold Next.js directly at repository root (not nested folder). Repository root is the application root.

**Rationale:** Simpler deployment, standard monorepo-free startup architecture.

## ADR-002: Supabase as Backend

**Date:** Phase 1  
**Status:** Accepted

Use Supabase for PostgreSQL, authentication, MFA, SSO, and RLS. No separate API server.

**Rationale:** Startup simplicity; Supabase provides required backend capabilities.

## ADR-003: Server-Side Privileged Operations

**Date:** Phase 1  
**Status:** Accepted

Imports, lifecycle updates, financial calculations, and admin functions run server-side via Next.js with service role credentials.

**Superseded in part:** User-facing lifecycle and import writes use the signed-in session (ADR-026, ADR-027). Service role remains for admin and CLI tools.

**Rationale:** Security requirement; never expose service role to browser.

## ADR-004: Space as Primary Lifecycle Object

**Date:** Phase 1  
**Status:** Accepted

User-facing term is "Space" for lifecycle-managed environments. Not "AV System", "Managed Unit", or "Lifecycle Group".

**Rationale:** Product specification; generic enough for multiple asset categories.

## ADR-005: Immutable Asset History

**Date:** Phase 1  
**Status:** Accepted

Equipment replacements create new asset records; old assets are retired. Never overwrite physical asset records.

**Rationale:** Historical continuity for lifecycle planning and audit.

## ADR-006: Lump-Sum Cost Support

**Date:** Phase 1  
**Status:** Accepted

Spaces may have lump-sum costs with $0 per-asset costs. Do not force per-asset pricing.

**Rationale:** Many customers only know total Space cost.

## ADR-007: Demo Data for Phase 1 UI

**Date:** Phase 1  
**Status:** Accepted

Overview and Spaces pages use isolated static demo data (`src/lib/demo-data.ts`) until Supabase schema is implemented.

**Rationale:** Enables polished UI development without production database.

## ADR-008: shadcn/ui Component Pattern

**Date:** Phase 1  
**Status:** Accepted

Use shadcn/ui (Radix primitives + Tailwind) for UI components. Components copied into `src/components/ui/`.

**Rationale:** Accessible, customizable, no runtime dependency lock-in.

## ADR-009: AWS Amplify Hosting (Planned)

**Date:** Phase 1  
**Status:** Proposed, not yet configured

Target hosting platform is AWS Amplify. Not provisioned in Phase 1.

**Rationale:** Product specification; deliberate simplicity over Kubernetes/Docker.

## ADR-010: No Testing Framework in Phase 1

**Date:** Phase 1  
**Status:** Accepted

No Playwright, Vitest, or other testing framework added in initial foundation.

**Rationale:** Explicit product guidance to avoid premature tooling.

## ADR-011: Auto-Create Organization on Signup

**Date:** Phase 2  
**Status:** Accepted

When a user signs up, a security-definer trigger creates one organization and an `owner` membership. Organization name comes from signup form metadata.

**Rationale:** MVP assumes one organization per signup; schema supports multi-org membership later without forcing org-creation UI in Phase 2.

## ADR-012: Display-Only Lifecycle Status in Phase 2

**Date:** Phase 2  
**Status:** Accepted

Lifecycle status (`upcoming`, `due`, `overdue`) is derived at read time from `commissioned_date + refresh_cycle_years` vs current year. The full lifecycle engine is deferred to Phase 3.

**Rationale:** Phase 2 scope is schema + auth + live data wiring, not lifecycle calculation.

## ADR-013: MVP RLS Write Matrix

**Date:** Phase 2  
**Status:** Accepted

`read_only` members can SELECT only. `member`, `admin`, and `owner` can write tenant data. Only `admin` and `owner` can manage memberships and organization settings.

**Rationale:** Simplest valid tenant security for MVP; documented in `/docs/security.md`.

## ADR-014: Add `@supabase/server` Alongside `@supabase/ssr`

**Date:** Phase 2  
**Status:** Accepted

Install `@supabase/server` for header-based JWT verification and new API key resolution (`SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWKS_URL`). Keep `@supabase/ssr` as the cookie-session client for the Next.js App Router.

**Rationale:** The packages are complementary, not replacements. Next.js dashboard auth stays cookie-based. `@supabase/server` is available for route handlers, Edge Functions, and other header-authenticated backends. Existing Next.js env helpers accept both the new names and the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` aliases.

## ADR-015: Industry-Only Benchmark Cohorts

**Date:** Phase 2 (benchmarking addendum)  
**Status:** Accepted

Organization benchmark cohorts are segmented by **industry type only** (`university`, `government`, `corporate`, `other` initially). Space Type and Asset Category slice metrics within a cohort but do not create narrower organization cohorts.

**Rationale:** Product requirement to compare lifecycle programs at a broad industry level without enabling re-identification via geographic, size, or subtype segmentation.

## ADR-016: Reciprocal Benchmark Participation

**Date:** Phase 2 (benchmarking addendum)  
**Status:** Accepted

`benchmark_participation` defaults to `true`. If an organization opts out, it stops contributing to aggregates **and** loses access to benchmark results. Normal lifecycle data is unaffected.

**Rationale:** Product reciprocity rule; prevents free-riding on anonymized peer data.

## ADR-017: Metric-Level Minimum Contributor Threshold

**Date:** Phase 2 (benchmarking addendum)  
**Status:** Accepted

Each benchmark metric (including Space Type / Asset Category / period context) requires **≥ 5 distinct organizations** with valid data before display. Threshold stored in `benchmark_system_settings.min_contributor_threshold`. Contributor counts are never customer-facing.

**Rationale:** Prevent re-identification and misleading small-sample benchmarks.

## ADR-018: Trusted Aggregation Boundary for Benchmarks

**Date:** Phase 2 (benchmarking addendum)  
**Status:** Accepted

Benchmark aggregates are produced via service-role server-side jobs into `benchmark_aggregate_metrics`. Customers read results through `get_benchmark_metrics_public()` only — never by querying other tenants' operational tables.

**Rationale:** Benchmarking is aggregate analytics, not cross-tenant data access. Preserves RLS on operational tables.

## ADR-019: Invitation-Only Onboarding

**Date:** Phase 2 (security addendum)  
**Status:** Accepted

Users cannot self-provision organizations. New accounts require a valid `organization_invitations` token. The signup trigger links users to invited organizations only. Organization creation is restricted to platform administrators via service-role server actions.

**Rationale:** Prevents unauthorized org/membership injection and ensures users are linked to the correct tenant.

## ADR-020: DEV Organization Platform Access

**Date:** Phase 2 (security addendum)  
**Status:** Accepted

Cross-tenant platform access is granted by membership in a single **DEV** organization (`organizations.is_dev_org = true`), not by hardcoded CLI commands or JWT metadata flags. DEV org members have cross-tenant read/write access via updated RLS helpers and may call `get_benchmark_metrics_admin()` to inspect sub-threshold benchmark metrics including contributor counts. Additional operators are onboarded by inviting them to the DEV org. Customer organization owners continue using `get_benchmark_metrics_public()` with the minimum-5-contributor rule unchanged.

**Rationale:** App operators need full visibility for support through normal invitation-based membership; customer anonymization guarantees remain intact for all organization owners.

## ADR-021: Calendar Year Forecasting in Phase 3

**Date:** Phase 3  
**Status:** Accepted

Replacement years and dashboard bars use calendar year. Chart legends already show `2026`, not `FY2026`.

**Rationale:** Matches current UI. Fiscal-year calendars stay in `/docs/open-questions.md`.

## ADR-022: Persist Forecast Amounts on Write

**Date:** Phase 3  
**Status:** Accepted

A pure engine computes `recommended_replacement_year` and `forecast_amount`. Server actions persist those values on `forecast_cost_components`. Dashboard reads stored amounts. No separate materialization table.

**Rationale:** The columns already exist. Scale-out caching remains an open question.

## ADR-023: Space Status From Earliest Cost Year

**Date:** Phase 3  
**Status:** Accepted

Space list/header lifecycle status uses the earliest recommended replacement year among current cost rows. Dashboard year totals sum component dollars, so one Space can appear in multiple years.

**Rationale:** Partial refresh creates independent schedules; a single Space commissioned date is not enough.

## ADR-024: Planning Year Is Overlay Only

**Date:** Phase 3  
**Status:** Accepted

`planning_status` and `planned_refresh_year` do not change calculated replacement years, retire assets, or rewrite forecasts.

**Rationale:** Planning and lifecycle are separate concepts in `/docs/lifecycle-model.md`.

## ADR-033: UX Redesign — Navigation and Information Architecture

**Date:** Product increment (UX redesign)  
**Status:** Accepted

Major UX/analytics redesign without backend rewrite:

- Navigation reorganized: Overview, Update Lifecycles hub, Lifecycle (Spaces/Assets), Planning (Forecast), Analytics (Benchmark/Reports), Data (Imports), Settings, DEV Admin
- **Capital Plan** merged into **Forecast**; `/capital-plan` redirects to `/forecast`
- **Correct Inventory** removed from sidebar; accessed via Update Lifecycles hub
- **Update Lifecycles** is a dedicated page (`/update-lifecycles`) with four distinct workflow cards
- Organization header: static for customers; selector for DEV team only
- Filters use apply-on-click pattern with searchable multi-select for large sets
- Charts must show visible numeric labels (not hover-only)
- Benchmark page uses visual percentile range cards; no contributor counts
- Reports expanded canned gallery; no custom report builder
- Client-side analytics helpers in `src/lib/data/analytics.ts` aggregate from existing Space/Asset queries — no new database views for this pass

**Rationale:** Product should feel like a lifecycle planning tool for AV/IT managers and capital planners, not a raw admin database. Existing RLS, lifecycle rules, and data model preserved.

## ADR-025: Single-Asset Partial Refresh Is Individual Replacement

**Date:** Phase 3  
**Status:** Accepted

Partial Refresh writes `individual_replacement` when exactly one asset is selected. There is no fifth Update Lifecycle menu item.

**Rationale:** Same user flow; event history still distinguishes a single replacement.

## ADR-026: Lifecycle Writes Use the Signed-In Session

**Date:** Phase 3  
**Status:** Accepted

Add Space, refresh, correct-inventory, and planning updates run as Next.js server actions with the user session. RLS `can_write_organization()` enforces owner/admin/member. Service role is not used to bypass RLS.

**Rationale:** Tenant isolation must hold for lifecycle mutations.

## ADR-027: User Imports Use the Signed-In Session

**Date:** Phase 4  
**Status:** Accepted

CSV/Excel import processing runs as Next.js server actions with the user session. RLS `can_write_organization()` enforces owner/admin/member. Service role is not used to bypass RLS. The development Asset QT script remains a service-role CLI tool.

**Rationale:** Same tenant rule as ADR-026. User-facing imports are lifecycle writes.

## ADR-028: SheetJS for Excel Import

**Date:** Phase 4  
**Status:** Accepted

Use the `xlsx` (SheetJS) package to parse `.xlsx` / `.xls` uploads. CSV is parsed without a library.

**Rationale:** Import-model requires Excel. SheetJS reads workbook bytes in a Next.js server action without a separate conversion service.

## ADR-029: Correct Inventory Is Not a File Import

**Date:** Product increment  
**Status:** Accepted

Correct Inventory is a searchable in-app edit of Spaces and assets. File imports are Add New Spaces, Full Refresh, and Partial Refresh only. Import history is stored in `import_jobs`.

**Rationale:** Customers need to fix inventory without manufacturing a spreadsheet or triggering a lifecycle event.

## ADR-030: Space Lump-Sum Costs From Managed Units

**Date:** Product increment  
**Status:** Accepted

Portfolio money reports use Space `original_cost` (Zoho Managed Units Total Initial Capital Cost). Per-asset prices may stay $0. Forecast amounts are recomputed with the app inflation engine — Zoho Total Future Cost is not imported.

**Rationale:** Asset QT has no cost column. Spreading Space totals onto assets would invent per-asset prices.

## ADR-031: Reports Stay Canned

**Date:** Product increment  
**Status:** Accepted

Reports are a fixed canned set with saved filters (`saved_reports`). No report builder. Average cost per asset is not a main report. CSV and Excel export use the existing SheetJS dependency. PDF remains an open question.

**Rationale:** Matches Zoho GLOBAL information needs without a new reporting product.

## ADR-032: Hosting Docs Without Provisioning Amplify

**Date:** Product increment  
**Status:** Accepted

Document how the Next.js app would be hosted on AWS Amplify, but do not provision Amplify, add CI, or add monitoring tooling.

**Rationale:** Deployment remains an explicit human decision. See `/docs/deployment.md`.
