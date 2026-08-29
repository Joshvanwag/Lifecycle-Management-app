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
