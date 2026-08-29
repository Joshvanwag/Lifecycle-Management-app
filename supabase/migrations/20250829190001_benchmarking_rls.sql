-- Phase 2 addendum: Benchmarking RLS policies
-- Benchmarking must NOT weaken tenant isolation on operational tables.

-- ---------------------------------------------------------------------------
-- industry_types — readable catalog for signup/settings UI
-- ---------------------------------------------------------------------------

alter table public.industry_types enable row level security;

create policy "Authenticated users can read active industry types"
  on public.industry_types
  for select
  to authenticated
  using (is_active = true);

-- ---------------------------------------------------------------------------
-- benchmark_system_settings — internal only (service role aggregation pipeline)
-- ---------------------------------------------------------------------------

alter table public.benchmark_system_settings enable row level security;

-- No policies for authenticated — only service role may read/write.

-- ---------------------------------------------------------------------------
-- benchmark_metrics — readable metric catalog
-- ---------------------------------------------------------------------------

alter table public.benchmark_metrics enable row level security;

create policy "Authenticated users can read active benchmark metrics"
  on public.benchmark_metrics
  for select
  to authenticated
  using (is_active = true);

-- ---------------------------------------------------------------------------
-- organization_benchmark_values — tenant reads own values only
-- Writes reserved for trusted server-side aggregation (service role).
-- ---------------------------------------------------------------------------

alter table public.organization_benchmark_values enable row level security;

create policy "Members can read their organization benchmark values"
  on public.organization_benchmark_values
  for select
  to authenticated
  using (organization_id in (select public.user_organization_ids()));

-- ---------------------------------------------------------------------------
-- benchmark_aggregate_metrics — no direct client access
-- Customer reads go through get_benchmark_metrics_public() only.
-- ---------------------------------------------------------------------------

alter table public.benchmark_aggregate_metrics enable row level security;

revoke all on table public.benchmark_aggregate_metrics from anon, authenticated;

-- ---------------------------------------------------------------------------
-- organizations — industry_type and benchmark_participation managed via
-- existing can_manage_organization() update policy on organizations.
-- ---------------------------------------------------------------------------
