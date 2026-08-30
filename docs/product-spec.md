# Product Specification

## Purpose

Lifecycle Management is a multi-tenant SaaS platform that helps organizations manage technology and equipment portfolios through their full lifecycle — from initial deployment through refresh planning and capital budgeting.

## Initial Target Market

Universities and higher education organizations managing AV equipment. Architecture and terminology remain generic to support future asset categories: AV, IT, lighting, security, networking, and other technology/equipment.

## Core Value Proposition

A customer can:

1. Import existing equipment inventory
2. Organize equipment into **Spaces**
3. Establish lifecycle/refresh assumptions
4. Forecast future replacement costs using compound inflation
5. Plan future capital budgets

The product must make complex lifecycle calculations feel extremely simple to the end user.

## Primary Domain Concepts

### Space

A lifecycle-managed environment or collection of equipment. Not necessarily a physical room.

Examples: Classroom 204, Executive Conference Room, Building Digital Signage, Mobile Technology Fleet.

### Asset

Every physical piece of equipment is its own Asset record, even when identical, lacking serial numbers, or lacking individual cost.

### Organization (Tenant)

One customer organization = one tenant. Users normally belong to one organization; architecture supports multi-organization membership for future use cases (consultants, integrators, support staff).

## Four Primary Data Maintenance Actions

1. **Add New Spaces** — onboarding and new deployments
2. **Full Refresh** — replace all active equipment after a complete refresh
3. **Partial Refresh** — user selects assets being replaced, adds new equipment
4. **Correct Inventory** — data corrections without lifecycle events

## Key Business Rules

- Default refresh cycle: 7 years (configurable per organization)
- Default inflation: 3.4% compounded annually
- Spaces do not have to be refreshed all together
- Lifecycle status (Upcoming, Due, Overdue) is separate from Planning status (Unplanned, Scheduled, Deferred, Completed)
- Historical actual costs are never rewritten when forecasting assumptions change
- Asset history is preserved — old equipment becomes retired, new equipment gets new records

## Out of Scope (Initial Phase)

- External integrations (ERP, CMMS, ServiceNow, etc.)
- Asset attachments / document management
- Full compliance certification (SOC 2, etc.) — design for future readiness
- Detailed condition scoring

## Reporting

Executive Overview, Forecast (including capital planning), and Benchmark answer:

- What do we own?
- What needs replacement, when, and at what cost?
- What is planned vs recommended?
- How do we compare with industry peers?

There is no standalone Reports product page or custom-report builder. Analytical views live on Overview, Spaces, Assets, Forecast, and Benchmark. Export utilities may remain for technical reuse. Import history lives on Update Lifecycles → History.

## Navigation and Information Architecture

See `/docs/ui-ux.md` for full UX specification. Summary:

- **Update Lifecycles** hub exposes four distinct workflows (Add New Spaces, Full Refresh, Partial Refresh, Correct Inventory), with Actions and History tabs
- **Forecast** is the primary planning workspace (absorbs Capital Plan)
- **Benchmark** is a single scrollable analytics page under Analytics
- Reports, Imports, Capital Plan, and Correct Inventory are not primary navigation items
- Customer users see single-organization context; DEV team may switch organizations from the top-left header only

## User Roles (Initial)

- Owner
- Admin
- User / Member
- Read Only (if useful)

Authorization should be designed for future granular permissions.

## Industry Benchmarking

Organizations may compare lifecycle performance against anonymized aggregates from peers in the same **industry type** (University, Government, Corporate, Other).

Key product rules:

- Benchmark participation defaults to **enabled**; admins may opt out
- Opt-out is **reciprocal** — non-participants do not receive benchmark results
- Industry type is the only organization cohort dimension initially
- Space Type and Asset Category provide **within-cohort** metric context
- Minimum **5 distinct organizations** per metric before display
- Contributor counts are never shown to customers
- No cross-tenant access to another organization's operational records

Full specification: [`/docs/benchmarking-model.md`](./benchmarking-model.md)
