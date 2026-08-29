-- Phase 2 addendum: Benchmarking foundation schema
-- Supports anonymous industry benchmarks without cross-tenant operational data access.

-- ---------------------------------------------------------------------------
-- Industry types (extensible reference table — not a closed enum)
-- ---------------------------------------------------------------------------

create table public.industry_types (
  code text primary key,
  label text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.industry_types (code, label, display_order) values
  ('university', 'University', 1),
  ('government', 'Government', 2),
  ('corporate', 'Corporate', 3),
  ('other', 'Other', 4);

-- ---------------------------------------------------------------------------
-- Organization benchmarking settings
-- ---------------------------------------------------------------------------

alter table public.organizations
  add column industry_type text not null default 'other'
    references public.industry_types (code),
  add column benchmark_participation boolean not null default true;

create index organizations_industry_type_idx on public.organizations (industry_type);
create index organizations_benchmark_participation_idx
  on public.organizations (benchmark_participation)
  where benchmark_participation = true;

-- ---------------------------------------------------------------------------
-- System settings (internal — threshold enforcement, not customer-facing)
-- ---------------------------------------------------------------------------

create table public.benchmark_system_settings (
  key text primary key,
  numeric_value numeric,
  text_value text,
  json_value jsonb,
  description text not null,
  updated_at timestamptz not null default now()
);

insert into public.benchmark_system_settings (key, numeric_value, description)
values (
  'min_contributor_threshold',
  5,
  'Minimum distinct participating organizations required per metric before a benchmark may be displayed'
);

create trigger benchmark_system_settings_set_updated_at
  before update on public.benchmark_system_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Benchmark metric catalog
-- ---------------------------------------------------------------------------

create table public.benchmark_metrics (
  code text primary key,
  name text not null,
  domain text not null check (
    domain in ('lifecycle_health', 'financial', 'planning_maturity')
  ),
  description text,
  value_kind text not null check (
    value_kind in ('percentage', 'currency', 'years', 'ratio', 'count_normalized')
  ),
  supports_space_type boolean not null default false,
  supports_asset_category boolean not null default false,
  supports_period_year boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Lifecycle health metrics
insert into public.benchmark_metrics (code, name, domain, value_kind, description) values
  ('avg_space_age_years', 'Average Space Age', 'lifecycle_health', 'years', 'Average age of active Spaces in years'),
  ('portfolio_pct_overdue', 'Portfolio Overdue Percentage', 'lifecycle_health', 'percentage', 'Percentage of portfolio value currently overdue'),
  ('portfolio_pct_due_this_year', 'Due This Year Percentage', 'lifecycle_health', 'percentage', 'Percentage of portfolio due for refresh this year'),
  ('portfolio_pct_due_1_3_years', 'Due in 1–3 Years Percentage', 'lifecycle_health', 'percentage', 'Percentage of portfolio due in the next 1–3 years'),
  ('portfolio_pct_due_4_7_years', 'Due in 4–7 Years Percentage', 'lifecycle_health', 'percentage', 'Percentage of portfolio due in 4–7 years'),
  ('portfolio_pct_due_beyond_7_years', 'Due Beyond 7 Years Percentage', 'lifecycle_health', 'percentage', 'Percentage of portfolio due beyond 7 years'),
  ('avg_refresh_cycle_years', 'Average Refresh Cycle', 'lifecycle_health', 'years', 'Average refresh cycle across active Spaces'),
  ('median_refresh_cycle_years', 'Median Refresh Cycle', 'lifecycle_health', 'years', 'Median refresh cycle across active Spaces');

-- Financial metrics (normalized)
insert into public.benchmark_metrics (code, name, domain, value_kind, supports_space_type, supports_asset_category, supports_period_year, description) values
  ('avg_replacement_cost_per_space', 'Average Replacement Cost per Space', 'financial', 'currency', true, false, false, 'Average forecast replacement cost normalized per Space'),
  ('median_replacement_cost_per_space', 'Median Replacement Cost per Space', 'financial', 'currency', true, false, false, 'Median forecast replacement cost normalized per Space'),
  ('annual_forecast_spend_per_space', 'Annual Forecast Spend per Space', 'financial', 'currency', false, false, true, 'Annual forecast spend normalized per Space'),
  ('five_year_forecast_per_space', 'Five-Year Forecast per Space', 'financial', 'currency', false, false, false, 'Five-year forecast normalized per Space'),
  ('avg_cost_per_asset', 'Average Cost per Asset', 'financial', 'currency', false, true, false, 'Average replacement cost normalized per Asset'),
  ('median_cost_per_asset', 'Median Cost per Asset', 'financial', 'currency', false, true, false, 'Median replacement cost normalized per Asset'),
  ('portfolio_pct_value_overdue', 'Portfolio Value Overdue Percentage', 'financial', 'percentage', false, false, false, 'Percentage of total portfolio value currently overdue');

-- Planning maturity metrics
insert into public.benchmark_metrics (code, name, domain, value_kind, description) values
  ('pct_lifecycle_need_planned', 'Lifecycle Need with Plan', 'planning_maturity', 'percentage', 'Percentage of lifecycle need that has a plan'),
  ('pct_scheduled', 'Scheduled Percentage', 'planning_maturity', 'percentage', 'Percentage of lifecycle need scheduled'),
  ('pct_deferred', 'Deferred Percentage', 'planning_maturity', 'percentage', 'Percentage of lifecycle need deferred'),
  ('pct_overdue_scheduled', 'Overdue but Scheduled Percentage', 'planning_maturity', 'percentage', 'Percentage overdue but already scheduled'),
  ('pct_upcoming_with_planned_replacement', 'Upcoming with Planned Replacement', 'planning_maturity', 'percentage', 'Percentage of upcoming lifecycle need with a planned replacement');

-- Space Type and Asset Category slice metrics (context dimensions — not org cohorts)
insert into public.benchmark_metrics (code, name, domain, value_kind, supports_space_type, supports_asset_category, description) values
  ('space_type_avg_lifecycle_years', 'Average Lifecycle by Space Type', 'lifecycle_health', 'years', true, false, 'Average lifecycle for a given Space Type within an industry cohort'),
  ('space_type_median_lifecycle_years', 'Median Lifecycle by Space Type', 'lifecycle_health', 'years', true, false, 'Median lifecycle for a given Space Type within an industry cohort'),
  ('space_type_overdue_pct', 'Overdue Percentage by Space Type', 'lifecycle_health', 'percentage', true, false, 'Overdue percentage for a given Space Type'),
  ('space_type_due_pct', 'Due Percentage by Space Type', 'lifecycle_health', 'percentage', true, false, 'Due percentage for a given Space Type'),
  ('space_type_avg_asset_count', 'Average Asset Count by Space Type', 'lifecycle_health', 'count_normalized', true, false, 'Average active asset count per Space for a Space Type'),
  ('space_type_planned_refresh_coverage_pct', 'Planned Refresh Coverage by Space Type', 'planning_maturity', 'percentage', true, false, 'Percentage of lifecycle need with planned refresh for a Space Type'),
  ('category_avg_lifecycle_years', 'Average Lifecycle by Asset Category', 'lifecycle_health', 'years', false, true, 'Average lifecycle for a given Asset Category within an industry cohort'),
  ('category_median_lifecycle_years', 'Median Lifecycle by Asset Category', 'lifecycle_health', 'years', false, true, 'Median lifecycle for a given Asset Category'),
  ('category_avg_replacement_cost', 'Average Replacement Cost by Asset Category', 'financial', 'currency', false, true, 'Average replacement cost for a given Asset Category'),
  ('category_median_replacement_cost', 'Median Replacement Cost by Asset Category', 'financial', 'currency', false, true, 'Median replacement cost for a given Asset Category'),
  ('category_overdue_pct', 'Overdue Percentage by Asset Category', 'lifecycle_health', 'percentage', false, true, 'Overdue percentage for a given Asset Category'),
  ('category_forecast_cost', 'Forecast Cost by Asset Category', 'financial', 'currency', false, true, 'Normalized forecast cost for a given Asset Category');

-- ---------------------------------------------------------------------------
-- Per-organization computed values (tenant-owned; used for "your org" + aggregation input)
-- Populated by trusted server-side aggregation — not by cross-tenant reads.
-- ---------------------------------------------------------------------------

create table public.organization_benchmark_values (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  metric_code text not null references public.benchmark_metrics (code),
  space_type text,
  asset_category text,
  period_year integer,
  value numeric not null,
  computed_at timestamptz not null default now(),
  unique nulls not distinct (
    organization_id,
    metric_code,
    space_type,
    asset_category,
    period_year
  )
);

create index organization_benchmark_values_org_idx
  on public.organization_benchmark_values (organization_id);

create index organization_benchmark_values_metric_idx
  on public.organization_benchmark_values (metric_code);

-- ---------------------------------------------------------------------------
-- Anonymous aggregate benchmark output (no source organization identifiers)
-- contributor_count is internal threshold enforcement only.
-- ---------------------------------------------------------------------------

create table public.benchmark_aggregate_metrics (
  id uuid primary key default gen_random_uuid(),
  industry_type text not null references public.industry_types (code),
  metric_code text not null references public.benchmark_metrics (code),
  space_type text,
  asset_category text,
  period_year integer,
  average numeric,
  median numeric,
  percentile_25 numeric,
  percentile_75 numeric,
  contributor_count integer not null default 0,
  is_eligible boolean not null default false,
  computed_at timestamptz not null default now(),
  unique nulls not distinct (
    industry_type,
    metric_code,
    space_type,
    asset_category,
    period_year
  )
);

create index benchmark_aggregate_metrics_industry_idx
  on public.benchmark_aggregate_metrics (industry_type);

create index benchmark_aggregate_metrics_eligible_idx
  on public.benchmark_aggregate_metrics (industry_type, is_eligible)
  where is_eligible = true;

-- ---------------------------------------------------------------------------
-- Helper: benchmark access (reciprocity — must participate to read)
-- ---------------------------------------------------------------------------

create or replace function public.user_can_access_benchmarks(target_industry_type text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships om
    join public.organizations o on o.id = om.organization_id
    where om.user_id = auth.uid()
      and o.benchmark_participation = true
      and o.industry_type = target_industry_type
  );
$$;

revoke all on function public.user_can_access_benchmarks(text) from public;
grant execute on function public.user_can_access_benchmarks(text) to authenticated;

-- Customer-facing RPC — excludes contributor_count and ineligible metrics.
-- Authenticated clients must use this function, not the base aggregate table.

create or replace function public.get_benchmark_metrics_public(
  p_metric_code text default null,
  p_space_type text default null,
  p_asset_category text default null,
  p_period_year integer default null
)
returns table (
  id uuid,
  industry_type text,
  metric_code text,
  space_type text,
  asset_category text,
  period_year integer,
  average numeric,
  median numeric,
  percentile_25 numeric,
  percentile_75 numeric,
  computed_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.id,
    b.industry_type,
    b.metric_code,
    b.space_type,
    b.asset_category,
    b.period_year,
    b.average,
    b.median,
    b.percentile_25,
    b.percentile_75,
    b.computed_at
  from public.benchmark_aggregate_metrics b
  where b.is_eligible = true
    and public.user_can_access_benchmarks(b.industry_type)
    and (p_metric_code is null or b.metric_code = p_metric_code)
    and (p_space_type is null or b.space_type is not distinct from p_space_type)
    and (p_asset_category is null or b.asset_category is not distinct from p_asset_category)
    and (p_period_year is null or b.period_year is not distinct from p_period_year);
$$;

revoke all on function public.get_benchmark_metrics_public(text, text, text, integer) from public;
grant execute on function public.get_benchmark_metrics_public(text, text, text, integer) to authenticated;

comment on function public.get_benchmark_metrics_public is
  'Returns eligible anonymous benchmark aggregates for the caller industry cohort. Never exposes contributor counts or source organization identifiers.';

-- ---------------------------------------------------------------------------
-- Update signup trigger to capture industry type from metadata
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  org_name text;
  org_industry text;
begin
  org_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'organization_name'), ''),
    'My Organization'
  );

  org_industry := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'industry_type'), ''),
    'other'
  );

  if not exists (select 1 from public.industry_types where code = org_industry and is_active) then
    org_industry := 'other';
  end if;

  insert into public.organizations (name, industry_type, benchmark_participation)
  values (org_name, org_industry, true)
  returning id into new_org_id;

  insert into public.organization_memberships (organization_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  return new;
end;
$$;
