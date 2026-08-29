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

## Phase 2 — Database & Tenancy (Next)

- [ ] Supabase project connection
- [ ] Database schema migrations
  - [ ] Organizations
  - [ ] Organization memberships
  - [ ] Location hierarchy (campus, building, floor, physical location)
  - [ ] Spaces
  - [ ] Assets
  - [ ] Forecast cost components
  - [ ] Refresh events
  - [ ] Organization defaults (refresh cycle, inflation)
- [ ] Row Level Security policies
- [ ] Authentication flow (sign up, sign in, sign out)
- [ ] Organization context resolution
- [ ] Replace demo data with real queries

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
