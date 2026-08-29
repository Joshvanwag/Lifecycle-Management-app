# Forecasting Model

## Core Formula

Inflation compounds annually:

```
Future Value = Current Cost × (1 + Inflation Rate) ^ Years
```

- Default inflation: 3.4% (configurable per organization)
- Inflation starts from the commissioned/installed year of the cost basis
- Simple interest is NOT used

Example: $100,000 at 3.4% over 7 years.

## Forecast Cost Components

The underlying forecast is driven by cost components, which may be:

1. **Asset-specific** — tied to one asset
2. **Lump-sum** — represents unallocated or unknown per-item pricing

Each component has:
- Cost basis
- Cost basis date/year
- Refresh cycle
- Recommended replacement year
- Inflation assumption
- Projected future cost

Do not expose "Forecast Cost Component" terminology prominently to users.

## Space-Driven UX, Asset-Driven Calculation

Users experience forecasting at the Space level. The system aggregates underlying asset and lump-sum components.

Example drill-down:
```
FY2030 Forecast
  → Campus
    → Building
      → Space
        → Asset / lump cost
```

## Cost Scenarios

| Scenario | Space Cost | Asset Costs |
|----------|-----------|-------------|
| Fully itemized | Sum of assets | Individual values |
| Partially itemized | Mixed | Some $0, some known |
| Lump-sum | Total known | All $0 acceptable |

## Partial Refresh Cost Normalization

When a lump-sum Space has an asset independently replaced with known cost:

1. Normalize new cost back to original basis year:
   ```
   Normalized = New Cost / (1 + Inflation Rate) ^ Years Between
   ```
2. Subtract normalized amount from remaining lump-sum basis
3. New asset begins its own lifecycle with actual cost, install date, and cycle

For non-itemized partial refreshes, create a new lump-sum component for the partial refresh amount.

Example:
- Original Space: 2024, $100,000 lump
- Partial refresh 2027: $30,000 lump
- Normalize $30,000 to 2024 basis when reducing original
- Create new 2027 lump component: $30,000 with its own cycle

## Historical vs Forecast Costs

- **Historical actual costs** are immutable records of what was spent
- **Forecast basis** may use current assumptions but must not rewrite history
- Changing inflation assumptions affects future projections only

## Dashboard Aggregations

Forecast totals aggregatable by:
- Year
- Organization
- Location (Campus, Building)
- Space
- Asset/category
- Lifecycle status
- Planning status

## Phase 1 Status

Forecasting engine not yet implemented. Overview dashboard uses static demo data to demonstrate intended presentation.

## Phase 2+ Implementation Notes

- Calculations should run server-side
- Results may be cached/materialized for performance at scale
- Must handle millions of assets across organizations
- Server-side pagination for large result sets
