# UI / UX Guidelines

## Design Direction

Polished modern SaaS application designed for AV/IT lifecycle managers and capital planning decision makers.

The product should feel calm, modern, data-rich, professional, and easy to scan. It should not feel like a generic admin dashboard, a rainbow chart gallery, or a card-heavy AI layout.

Technicians may update data, but Overview is designed for managers and directors.

## Layout

```
[Sidebar] [Organization name          Notifications  User ▾]
[Sidebar] [PageHeader + content                            ]
```

- Persistent left sidebar
- Sidebar highlights the clicked item immediately; main content shows a loading indicator until the next page is ready
- Organization name appears **once**, top-left of the application header
- Top-right: notifications, avatar, user name, role/team indicator, account menu
- Do not repeat the organization selector in the top-right
- Analytical pages use available width; Settings uses a readable max width

## Navigation Structure

- **Overview**
- **+ Update Lifecycles** (prominent action below Overview)
- **Lifecycle:** Spaces, Assets
- **Planning:** Forecast
- **Analytics:** Benchmark
- **Settings**
- **DEV:** Admin (platform admin / DEV team only)

Removed from navigation and primary product IA:

- Reports
- Imports
- Capital Plan (merged into Forecast)
- Correct Inventory (accessed via Update Lifecycles)

`/reports` redirects to Overview. `/imports` redirects to Update Lifecycles → History. `/capital-plan` redirects to Forecast. File-import routes remain under `/imports/[workflow]` as workflow steps, not a standalone product page.

## Organization Context

The active organization applies to the entire application: Overview, Spaces, Assets, Forecast, Benchmark, Update Lifecycles, and Settings.

| User type | Header behavior |
| --- | --- |
| Customer | Static organization name — not clickable, no dropdown |
| DEV team | Same location is a selector; changing it switches the global organization context |

Do not show cross-organization language such as “across 10 organizations” when a specific organization is selected. Do not mix DEV portfolio totals with the selected customer’s metrics. The only exception is anonymized Benchmark peer data.

Do not show an Organization filter on customer pages, or when a DEV user is working inside a selected organization.

## Page Header

Every page starts with a consistent `PageHeader`:

- Title
- Concise supporting sentence
- Optional actions aligned right

Do not wrap page-level controls in large bordered cards. Do not place giant full-width search bars above every page.

Examples:

- Overview — Portfolio health, lifecycle needs, and planning outlook.
- Spaces — Manage lifecycle Spaces and understand upcoming replacement needs.
- Assets — View active equipment, lifecycle age, and replacement exposure.
- Forecast — Plan future lifecycle needs and compare recommended work with planned work.
- Benchmark — Compare your lifecycle program with anonymized, aggregated industry peers.

## Design System

Reusable visual grammar lives in `src/components/design-system/` and shared chart/filter components:

- AppHeader
- PageHeader
- FilterToolbar (`PageToolbar`)
- KPIGrid / KPI card
- ChartCard, chart tooltips, chart legends
- FilterDrawer (`SpaceFilters`) + FilterCombobox + AppliedFilterChips
- SecondaryTabs
- SettingsNavigation / SettingsSection
- EmptyState
- StatusBadge

Use cards for KPIs, primary charts, and actionable selections. Prefer spacing, separators, and typography for toolbars, form sections, and empty states.

## Typography

- Page title: strong and clear
- Page subtitle: muted
- Section title: smaller than the page title
- Chart title: compact
- Chart description: small/muted
- KPI label: muted
- KPI value: prominent

Avoid large amounts of explanatory microcopy.

## Color System

Restrained blue/neutral language. Color represents meaning, not variety.

| Meaning | Color |
| --- | --- |
| Primary / recommended | blue |
| Planned / upcoming | teal / secondary blue |
| Due | amber |
| Overdue | red |
| Deferred | orange / amber |
| Completed | green |
| Unplanned | neutral gray |

Year-based charts use **one color** for the same metric (example: Replacement Need by Year is all primary blue).

Non-semantic categories (Space Type, Manufacturer, Asset Category) use single-color ranked bars or restrained related shades. Do not assign every category a random color.

## Charts

Charts must be understandable without hover. Tooltips add detail, not basic comprehension.

Tooltip rules:

- Name the actual metric and unit
- Year forecast: Recommended Need, Planned, Planning Gap
- Category/type charts: count + share, not currency, unless the chart is a cost chart
- Never show generic “Amount” for counts
- Never show raw array indexes
- Omit the tooltip if it adds no value

Chart action menus appear only when they do something useful (reset drill-down, export, view data). Decorative three-dot menus are not shown.

Charts should fill their card area, size to the dataset, and avoid oversized empty regions. Ranked horizontal charts size to row count where practical.

## Filtering

- **Filters** opens a drawer
- Description: “Adjust filters, then click Apply Filters.”
- Compact searchable multi-select comboboxes for Campus, Building, Space Type, and Refresh Year
- Lifecycle and Planning status use compact toggles
- Changes do not take effect until **Apply Filters**
- After apply, removable chips appear above the content
- **Clear all** is available when filters are active
- Organization is not a page filter inside a selected-organization context

## Tables

- Dense but readable
- Subtle row separators, hover state, pointer cursor on clickable rows
- Sticky header where useful
- Clear numeric alignment
- Consistent badges
- Table content should appear quickly on Spaces and Assets — do not bury records under giant dashboard cards

## Overview

Primary executive dashboard.

- PageHeader + Filters button + chips
- No Search Spaces
- Compact KPIs: Spaces, Assets, Current Portfolio Value, 5-Year Replacement Need, Due This Year, Overdue, Planned
- Primary chart: Replacement Need by Year (full width, consistent blue bars, visible dollar labels, year drill-down)
- Secondary: Lifecycle Distribution, Recommended vs Planned, Planning Status, Top Future Cost Categories
- Portfolio by Space Type is compact and lower priority

## Spaces

Table-first.

- Compact KPIs: Total Spaces, Current Portfolio Value, 5-Year Replacement Need, Overdue Spaces
- Optional compact lifecycle/type summaries
- Search + Filters
- Table columns: Space, Location, Type, Assets, Lifecycle, Recommended Year, Planning, Planned Year, Forecast
- Rows are clickable

## Assets

Table-first.

- KPIs: Total Assets, Asset-Level Cost (excludes lump-sum Space costs), Due, Overdue
- Search + Filters immediately after KPIs
- Table, then compact category/manufacturer/replacement/age analytics
- KPI, chart, table, and subtitle counts must use the same organization and filter context
- Category and manufacturer names must render on charts

## Forecast

- KPIs: 1 / 3 / 5 / 10-year need, Planned Amount, Unplanned Amount
- Primary: 10-Year Capital Need — one color for Recommended Need, visible dollar labels
- Recommended vs Planned: recommended = primary blue, planned = teal
- Planning Gap: one consistent gap color
- Planned means lifecycle work intentionally scheduled, not necessarily funded. Do not rename Planned.

## Benchmark

One scrollable analytical dashboard. No tabs.

Show the cohort clearly (Corporate Benchmark, University Benchmark, etc.). Never show participant count, rank, or peer identities.

- Benchmark Filters (Space Type, Asset Category, and similar metric context). Industry Type cannot be changed here.
- Filters apply only after Apply Filters. The 5-organization minimum still suppresses peer values.
- When most peer data is unavailable, show **one** banner: “Industry benchmark data is still building…”
- Individual cards show the organization’s metric and **Unavailable** for the industry value. Do not repeat the long unavailable sentence on every card.
- KPI comparison cards distinguish Your Organization vs Industry Median without implying ranking
- Range visual: 25th — median — 75th, with Your Organization as a marker. No percentile rank.
- Charts: Lifecycle Health, Financial Comparison, Planning Maturity, Equipment Category, Space Type

## Update Lifecycles

Tabs: **Actions** (default) and **History**.

Action tiles are fully clickable. Do not put redundant Start / Import from file buttons on the tiles. The next step may ask for manual entry, file upload, or a Space selection.

History shows lifecycle import/refresh jobs:

- Date, Workflow Type, User, Spaces Affected, Assets Added, Assets Retired, File Name, Status

Correct Inventory may appear in activity where useful, but it never creates a refresh event.

Empty history:

- No lifecycle updates yet
- Completed imports and refresh workflows will appear here.
- [Add New Spaces]

## Settings

Section navigation (understated tabs, not giant gray pills):

- General — Industry Type, Include Floors
- Lifecycle Defaults — Default Refresh Cycle, Default Inflation (used when no more-specific override exists)
- Benchmarking — Industry Benchmarking switch
- Members & Access — members, invitations, roles
- Authentication — MFA, future SSO

## Secondary Tabs

Use understated text tabs with a thin active underline. Do not use a large full-width gray strip.

Examples: Update Lifecycles Actions/History; Space detail Overview/Assets/Lifecycle/History.

## Empty States

Compact and intentional. Do not create giant mostly-empty bordered cards.

## Cursor / Pointer Interaction

- Clickable elements → pointer cursor
- Text-entry elements → text cursor
- Non-interactive elements → default cursor
- Clickable table rows and chart segments → pointer cursor + hover state

Implemented globally in `src/app/globals.css`.

## Space Detail Page

Header: name, location, type, lifecycle/planning badges, recommended year, planned year, cost/forecast.

Secondary tabs: Overview, Assets, Lifecycle, History.

Actions: Update Lifecycles dropdown (Full Refresh, Partial Refresh, Correct Inventory).
