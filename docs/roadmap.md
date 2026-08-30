# Roadmap

## Phase 1 — Foundation (Complete)

- [x] Next.js + TypeScript + Tailwind scaffold
- [x] shadcn/ui components
- [x] Application shell (sidebar, header, navigation)
- [x] Overview dashboard (demo data)
- [x] Spaces list page (search, filters, table)
- [x] Space detail page (tabs, lifecycle actions)
- [x] Placeholder pages for remaining navigation
- [x] Supabase client utilities and env handling
- [x] Documentation structure
- [x] AI engineering rules (AGENTS.md)
- [x] Supabase migration directory structure

## Phase 2 — Database & Tenancy (Complete)

- [x] Supabase project connection (env + client utilities)
- [x] Database schema migrations
  - [x] Organizations
  - [x] Organization memberships
  - [x] Location hierarchy (campus, building, floor, physical location)
  - [x] Spaces
  - [x] Assets
  - [x] Forecast cost components
  - [x] Refresh events
  - [x] Organization defaults (refresh cycle, inflation)
- [x] Row Level Security policies
- [x] Authentication flow (sign up, sign in, sign out)
- [x] Organization context resolution
- [x] Replace demo data with real queries (Overview, Spaces list, Space detail)
- [x] Benchmarking foundation schema
  - [x] Organization industry type and benchmark participation settings
  - [x] Metric catalog and aggregate output model
  - [x] Minimum contributor threshold (system setting)
  - [x] Secure public RPC (`get_benchmark_metrics_public`)
  - [x] Benchmarking RLS (no cross-tenant operational access)
- [x] Benchmark tab (`/benchmark`) for your-org vs industry aggregates

## Phase 3 — Core Lifecycle (Complete)

- [x] Lifecycle calculation engine
- [x] Forecasting with compound inflation
- [x] Lump-sum cost normalization
- [x] Lifecycle status calculation
- [x] Planning status management
- [x] Refresh event recording

## Phase 4 — Import Workflows (Complete)

- [x] CSV/Excel upload
- [x] Column mapping UI
- [x] Add New Spaces import
- [x] Full Refresh workflow
- [x] Partial Refresh workflow
- [x] Correct Inventory workflow
- [x] Reusable import mappings

## Phase 5 — Reporting & Planning

- [x] Forecast page with drill-down
- [x] Capital Plan
- [x] Reports (lifecycle overview, asset lists, summaries)
- [x] Dashboard with live data
- [x] Server-side pagination and filtering

## Phase 6 — Enterprise Features

- [x] MFA enroll UI (TOTP)
- [ ] SSO configuration (IdP not provisioned)
- [x] User management and roles (members list + invitations)
- [x] Audit logging
- [x] Export (CSV, Excel)
- [ ] PDF export
- [ ] AWS Amplify deployment (documented only)

## Phase 7 — Scale & Polish

- [x] Performance optimization for large inventories (read-path backfill removed; overview no longer loads assets)
- [x] Saved reports
- [x] Multi-organization user support (existing membership + DEV switcher)
- [x] Floor-level location option (org flag, default off)
- [ ] Compliance preparation (SOC 2 readiness)
