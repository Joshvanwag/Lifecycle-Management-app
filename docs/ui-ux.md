# UI / UX Guidelines

## Design Direction

Polished modern SaaS application inspired by Canvas, Zoho, and Zen-style enterprise applications.

**Not** inspired by Enzy.

## Layout

```
[Sidebar] [Top Header                     User ▾]
[Sidebar] [Page Content                        ]
```

- Persistent left sidebar (primary navigation)
- Simple top bar with page title
- User/account controls top-right
- Main content workspace

## Navigation Structure

- Overview
- Lifecycle: Spaces, Assets, Forecast
- Planning: Capital Plan, Reports
- Data: Imports
- Settings

## Design Principles

- Clean, modern, enterprise, professional
- Data-rich without clutter
- Generous but efficient spacing
- Readable typography, clear hierarchy
- Restrained color usage
- High quality tables and charts
- Obvious interactions
- No excessive animation
- No generic "AI startup" appearance

Should NOT feel like:
- A raw database
- A BI administration portal
- A spreadsheet replacement

## Cursor / Pointer Interaction

**Required:**
- Clickable elements → pointer cursor on hover (buttons, links, sidebar items, table rows, cards, dropdowns, chart drill-downs)
- Text-entry elements → text cursor (inputs, textareas)
- Non-interactive elements → default cursor
- Clear hover states on clickable items
- Adequate click targets

Implemented globally in `src/app/globals.css`.

## Charts

- Charts use a high-contrast 12-color palette so years and categories are easy to distinguish
- Legend keys show the year number only (e.g. `2026`, not `FY2026`)
- Customize colors from each chart's **⋮** options menu (not Settings)
- Overview charts: lifecycle status, planned amount by year, deployment by month
- Assets charts: manufacturer top 10, product type breakdown
- All charts respect the same portfolio filters as the page they appear on

## Filtering

Do NOT use a filter bar with many dropdowns across the top.

Preferred pattern:
- Search field when useful
- "Filters" button → drawer/popover
- Context-specific filters per screen
- Active filters as removable chips

## Tables

- Readable row heights
- Clear column hierarchy
- Hover state on rows
- Pointer cursor when row is clickable
- Click row to open detail
- Search and context-specific filters
- Server-side pagination for large datasets (Phase 2+)

## Space Detail Page

Header: name, location, type, lifecycle status, planning status, forecast amount.

Tabs: Overview, Assets, Lifecycle, History.

Actions (dropdown menu): Full Refresh, Partial Refresh, Correct Inventory.

## Primary Lifecycle Action

Prominent "Update Lifecycle" action with four options, each with clear explanation.

## Phase 1 Implementation

- Application shell with sidebar and header
- Overview dashboard with demo metrics and chart
- Spaces list with search, filter drawer, filter chips
- Space detail with tabs and lifecycle action menu
- Placeholder pages for remaining navigation items
