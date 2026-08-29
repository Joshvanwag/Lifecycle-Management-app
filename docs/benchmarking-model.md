# Benchmarking Model

## Purpose

Organizations compare their lifecycle program performance against **anonymized, aggregated** organizations in the same broad **industry cohort**.

Example question:

> How does my lifecycle program compare to other universities?

Benchmarking is an **aggregate product feature**, not cross-tenant data access. No customer may inspect another organization's underlying records.

## Organization Settings

### Industry Type

Each organization has one **industry type** — the only organization-level benchmark cohort segmentation in the initial design.

Initial values (extensible via `industry_types` reference table):

| Code | Label |
| --- | --- |
| `university` | University |
| `government` | Government |
| `corporate` | Corporate |
| `other` | Other |

New industry types may be added by inserting rows into `industry_types` without schema redesign.

**Not allowed** as organization cohort dimensions: geography, state, region, enrollment, company size, campus count, revenue, institution subtype, public/private status, or any other identifying segmentation.

### Benchmark Participation

| Setting | Default | Managed by |
| --- | --- | --- |
| `benchmark_participation` | **Enabled (`true`)** | Organization owner or admin |

**Reciprocity rule (non-negotiable):**

- If an organization **opts out** of contributing data, it **also loses access** to benchmark results.
- Participation and benchmark access are reciprocal.
- Opting out does **not** delete or alter normal lifecycle operational data.

## Cohort vs Context Dimensions

| Dimension | Role |
| --- | --- |
| **Industry Type** | Organization cohort — who is compared at the org level |
| **Space Type** | Context within cohort — e.g. university → classroom benchmark |
| **Asset Category** | Context within cohort — e.g. university → display category benchmark |

Space Type and Asset Category slice metrics **within** the industry cohort. They do **not** create narrower organization cohorts.

Both Space Type (`spaces.space_type`) and Asset Category (`assets.category`) remain **user-definable** product data — not hard-coded lists.

## Minimum Contributor Rule

A benchmark metric may only be displayed when **at least 5 distinct organizations** have valid contributing data for **that specific metric** (including its Space Type / Asset Category / period context).

- Rule applies at **metric-level** granularity, not overall cohort size.
- Example: 20 universities participate, but only 3 have valid auditorium replacement cost → **must not display** that metric.
- If below threshold, show only a generic unavailable message — **never** reveal whether the count is 1, 2, 3, or 4.

Threshold is stored in `benchmark_system_settings.min_contributor_threshold` (initial value: **5**). Application code references `BENCHMARK_MIN_CONTRIBUTOR_THRESHOLD_DEFAULT` as documentation of the initial default; aggregation jobs must read the database setting.

## Contributor Count Disclosure

**Never expose** contributor counts to customers.

Prohibited UI/API examples:

- "Based on 24 universities"
- "17 organizations contributed to this metric"

`contributor_count` is stored on `benchmark_aggregate_metrics` for internal threshold enforcement only. It is **not** returned by `get_benchmark_metrics_public()`.

Unavailable message (customer-facing):

> Benchmark data is not yet available. Additional industry data is required before this benchmark can be displayed.

## Approved Statistics

Allowed aggregate outputs:

- Percentage
- Average
- Median (50th percentile)
- 25th percentile
- 75th percentile
- Normalized cost per Space
- Normalized cost per Asset
- Normalized cost per category
- Normalized forecast amounts
- Normalized planning metrics

Percentages and normalized measures are preferred over raw inventory counts because organization scale varies significantly.

### Allowed customer comparison example

```
Your overdue portfolio:     18%
University benchmark median: 13%
```

### Prohibited outputs (current phase)

- Organization rank ("4th out of 17")
- Customer percentile rank ("57th percentile")
- Highest/lowest peer values
- Another organization's exact value
- Raw individual tenant results
- Any identifying or operational fields (see Security section)

## Benchmark Domains

### Lifecycle Health

- Average Space age
- Percentage of portfolio overdue / due this year / due 1–3 / 4–7 / beyond 7 years
- Average and median refresh cycle
- Portfolio lifecycle distribution
- Space Type and Asset Category lifecycle slices

### Financial

- Average/median replacement cost per Space
- Annual and five-year forecast per Space
- Average/median cost per Asset
- Cost by Asset Category
- Percentage of portfolio value overdue
- Normalized forecast trends

Avoid peer comparisons based purely on total organization dollar value.

### Planning Maturity

- Percentage of lifecycle need with a plan
- Percentage scheduled / deferred
- Percentage overdue but scheduled
- Percentage of upcoming need with planned replacement
- Planned vs recommended timing

Planning Status remains conceptually separate from calculated Lifecycle Status.

## Data Model (Phase 2 Foundation)

```
industry_types                    — extensible industry catalog
organizations.industry_type       — cohort assignment
organizations.benchmark_participation — opt-in/out (default: true)

benchmark_system_settings         — min_contributor_threshold (internal)
benchmark_metrics                 — metric catalog (domain, value_kind, context flags)

organization_benchmark_values     — per-org computed values (tenant-owned)
                                    used for "your org" display + aggregation input

benchmark_aggregate_metrics       — anonymous aggregates (internal table)
                                    includes contributor_count, is_eligible

get_benchmark_metrics_public()    — customer-facing RPC (no contributor_count)
```

### Aggregation flow

```
Organization A operational data (RLS-isolated)
Organization B operational data (RLS-isolated)
Organization C operational data (RLS-isolated)
        ↓
Trusted server-side aggregation (service role)
        ↓
organization_benchmark_values (per org, tenant-readable own rows only)
        ↓
benchmark_aggregate_metrics (anonymous, threshold check → is_eligible)
        ↓
get_benchmark_metrics_public() (eligible + reciprocity check)
        ↓
Customer UI / API
```

The frontend **never** queries another organization's Spaces, Assets, or operational rows for benchmarking.

## Security

See `/docs/security.md` for RLS details.

Summary:

- Operational tenant tables retain existing RLS — unchanged.
- `benchmark_aggregate_metrics` has **no direct client SELECT** — access via `get_benchmark_metrics_public()` only.
- `user_can_access_benchmarks(industry_type)` enforces reciprocity (`benchmark_participation = true` and matching industry).
- Aggregation writes use **service role** only.

### Fields that must never appear in customer-facing benchmark output

Organization name, campus/building/floor/room names or codes, Space name, IP/MAC/serial/PO, user name/email, individual asset or space records, individual organization values, tenant identifiers, source organization UUIDs, participant/contributor count.

## Phase Scope

**In Phase 2:**

- Schema, organization settings, metric catalog, aggregate tables
- RLS and secure RPC boundary
- Signup industry type capture
- Documentation

**After Phase 2 (when core lifecycle data is stable):**

- Aggregation pipeline (scheduled job / server action)
- Benchmark dashboard UI
- Settings UI for benchmark participation toggle

Space Type and Asset Category benchmarking **model** is included now; full UI may follow later.
