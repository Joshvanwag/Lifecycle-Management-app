# Roadmap

## Phase 1 — Foundation (Current)

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

## Phase 2 — Database & Tenancy (Current)

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

## Phase 3 — Core Lifecycle

- [ ] Lifecycle calculation engine
- [ ] Forecasting with compound inflation
- [ ] Lump-sum cost normalization
- [ ] Lifecycle status calculation
- [ ] Planning status management
- [ ] Refresh event recording

## Phase 4 — Import Workflows

- [ ] CSV/Excel upload
- [ ] Column mapping UI
- [ ] Add New Spaces import
- [ ] Full Refresh workflow
- [ ] Partial Refresh workflow
- [ ] Correct Inventory workflow
- [ ] Reusable import mappings

## Phase 5 — Reporting & Planning

- [ ] Forecast page with drill-down
- [ ] Capital Plan
- [ ] Reports (lifecycle overview, asset lists, summaries)
- [ ] Dashboard with live data
- [ ] Server-side pagination and filtering

## Phase 6 — Enterprise Features

- [ ] MFA
- [ ] SSO configuration
- [ ] User management and roles
- [ ] Audit logging
- [ ] Export (CSV, Excel, PDF)
- [ ] AWS Amplify deployment

## Phase 7 — Scale & Polish

- [ ] Performance optimization for large inventories
- [ ] Saved reports
- [ ] Multi-organization user support
- [ ] Floor-level location option
- [ ] Compliance preparation (SOC 2 readiness)
