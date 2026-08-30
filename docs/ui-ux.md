# UI / UX Guidelines

## Design Direction

Polished modern SaaS application designed for AV/IT lifecycle managers and capital planning decision makers.

**Not** inspired by Enzy. Should **not** feel like a raw database or admin tool.

## Layout

```
[Sidebar] [Top Header                     User ▾]
[Sidebar] [Page Content                        ]
```

- Persistent left sidebar (primary navigation)
- Sidebar highlights the clicked item immediately; main content shows a loading indicator until the next page is ready
- Simple top bar with page title
- Organization context in header (static for customers; switcher for DEV team only)
- User/account controls top-right
- Main content workspace — analytical pages use full width; settings/forms use readable max-width

## Navigation Structure

- **Overview**
- **+ Update Lifecycles** (prominent action link below Overview — opens workflow hub)
- **Lifecycle:** Spaces, Assets
- **Planning:** Forecast (includes former Capital Plan functionality)
- **Analytics:** Benchmark, Reports
- **Data:** Imports
- **Settings**
- **DEV:** Admin (platform admin / DEV team only)

Removed from navigation:

- Capital Plan (merged into Forecast)
- Correct Inventory (accessed via Update Lifecycles hub or Space detail)

## Organization Context

| User type | Header behavior |
| --- | --- |
| Customer (single org) | Static organization name — not clickable, no dropdown |
| DEV team (platform admin) | Real organization selector; switching changes active org context |

Customer users never see multi-organization portfolio language on Overview or other customer-facing pages.

## Update Lifecycles Hub

Route: `/update-lifecycles`

Four distinct action cards (not collapsed into one generic import):

1. Add New Spaces
2. Full Refresh
3. Partial Refresh
4. Correct Inventory

Each card links to the manual workflow and (where applicable) a file import path.

## Design Principles

- Clean, modern, enterprise, professional
- Data-rich without clutter
- Efficient spacing — not excessively airy, not cramped
- Readable typography, clear hierarchy
- High quality tables and charts with visible numeric labels
- Obvious interactions

## Cursor / Pointer Interaction

**Required:**

- Clickable elements → pointer cursor
- Text-entry elements → text cursor
- Non-interactive elements → default cursor
- Clickable table rows and chart segments → pointer cursor + hover state

Implemented globally in `src/app/globals.css`.

## Charts

**Numeric label rule:** Charts must communicate useful numbers without requiring hover. Tooltips add precision; they are not the only way to read a chart.

- Bar charts, horizontal bars, stacked/grouped bars preferred
- Compact distribution bars with count + percentage labels
- Avoid oversized decorative donuts with empty space
- Currency, percentage, and count formatting on labels where practical
- Repeating the same chart on different pages is acceptable when context differs (e.g. Replacement Need by Year on Overview, Forecast, Space Detail)
- Customize colors from each chart's **⋮** options menu

Shared components: `LabeledBarChart`, `GroupedBarChart`, `LineSeriesChart`, `RankedListChart`, `PieDistributionChart`, `DistributionChart`, `ChartCard`.

## Filtering

Preferred pattern:

- Search field when useful
- **Filters** button → drawer/sheet
- Grouped sections: Organization (DEV multi-org only), Campus, Building, Space Type, Lifecycle Status, Planning Status, Refresh Year
- Searchable multi-select for large option sets (e.g. Buildings)
- **Apply Filters** button — changes do not query/filter until applied
- **Clear** resets draft in drawer
- Active filters shown as removable chips after apply

## Tables

- Denser professional row heights
- Clear column hierarchy
- Hover state and pointer cursor on clickable rows
- Right-aligned currency where appropriate
- Compact badges for lifecycle/planning state

## Benchmark Presentation

- Visual range cards: 25th / median / 75th percentile + peer average + your organization
- Never show contributor counts, ranks, or customer names
- Below 5-org threshold: generic unavailable message only
- Sections/tabs: Overview, Lifecycle Health, Financial, Planning, Space Types, Equipment
- Space Type and Equipment tabs use context selectors and slice metrics within the industry cohort

- KPI tiles are informational only (no navigation links); uniform 2×4 grid on analytics pages
- Filter toolbar at top of analytics pages with prominent **Filter data** / **Edit filters** button
- Categorical rankings use ranked list rows; lifecycle/planning distributions use pie charts
- Vertical bar charts for time-series data; per-chart **Reset** when drilled down
- Chart settings (numbers, goal line, legend) via settings icon on each chart card

## Reports

Custom report builder: filter portfolio data with the same Space filter sheet, name the report, pick metric and chart type, create chart, then tune display from the chart settings icon. Saved reports persist filters, chart type, and settings. CSV/Excel export included.

## Space Detail Page

Header: name, location, type, lifecycle/planning badges, recommended year, planned year, cost/forecast.

Overview tab: lifecycle summary KPIs (age, refresh cycle, upcoming/overdue assets), visual lifecycle timeline, cost summary, planning form.

Tabs: Overview, Assets, Lifecycle, History.

Lifecycle tab: visual timeline plus asset-level schedule table.

Assets tab includes lifecycle status badge and recommended refresh year.

Actions: Update Lifecycles dropdown (Full Refresh, Partial Refresh, Correct Inventory).

## Settings

Max-width layout (`max-w-3xl`). Sections: Organization (industry, lifecycle defaults, benchmarking), Members, Authentication (MFA), Activity.
