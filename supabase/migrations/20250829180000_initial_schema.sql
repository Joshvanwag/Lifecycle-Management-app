-- Phase 2: Core schema for multi-tenant lifecycle management

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.membership_role as enum ('owner', 'admin', 'member', 'read_only');

create type public.planning_status as enum (
  'unplanned',
  'scheduled',
  'deferred',
  'completed'
);

create type public.asset_status as enum ('active', 'retired');

create type public.refresh_event_type as enum (
  'initial_deployment',
  'full_refresh',
  'partial_refresh',
  'individual_replacement'
);

-- ---------------------------------------------------------------------------
-- Organizations & membership
-- ---------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_refresh_cycle_years integer not null default 7 check (default_refresh_cycle_years > 0),
  default_inflation_rate numeric(8, 6) not null default 0.034 check (default_inflation_rate >= 0),
  floors_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.membership_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index organization_memberships_user_id_idx
  on public.organization_memberships (user_id);

create index organization_memberships_organization_id_idx
  on public.organization_memberships (organization_id);

-- ---------------------------------------------------------------------------
-- Location hierarchy
-- ---------------------------------------------------------------------------

create table public.campuses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.buildings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  campus_id uuid not null references public.campuses (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, campus_id, name)
);

create table public.floors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  building_id uuid not null references public.buildings (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, building_id, name)
);

create table public.physical_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  building_id uuid not null references public.buildings (id) on delete cascade,
  floor_id uuid references public.floors (id) on delete set null,
  name text not null,
  location_type text not null default 'room',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index physical_locations_organization_id_idx
  on public.physical_locations (organization_id);

create index physical_locations_building_id_idx
  on public.physical_locations (building_id);

-- ---------------------------------------------------------------------------
-- Spaces & assets
-- ---------------------------------------------------------------------------

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  space_type text not null,
  commissioned_date date not null,
  refresh_cycle_years integer not null check (refresh_cycle_years > 0),
  original_cost numeric(14, 2) not null default 0 check (original_cost >= 0),
  planning_status public.planning_status not null default 'unplanned',
  planned_refresh_year integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index spaces_organization_id_idx on public.spaces (organization_id);

create table public.space_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  space_id uuid not null references public.spaces (id) on delete cascade,
  physical_location_id uuid not null references public.physical_locations (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (space_id, physical_location_id)
);

create index space_locations_space_id_idx on public.space_locations (space_id);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  space_id uuid not null references public.spaces (id) on delete cascade,
  manufacturer text not null default '',
  model_number text not null default '',
  category text not null default '',
  serial_number text,
  ip_address text,
  mac_address text,
  po_number text,
  install_date date not null,
  cost numeric(14, 2) not null default 0 check (cost >= 0),
  status public.asset_status not null default 'active',
  refresh_cycle_years integer not null check (refresh_cycle_years > 0),
  removed_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index assets_organization_id_idx on public.assets (organization_id);
create index assets_space_id_idx on public.assets (space_id);
create index assets_space_id_status_idx on public.assets (space_id, status);

-- ---------------------------------------------------------------------------
-- Forecasting & lifecycle history
-- ---------------------------------------------------------------------------

create table public.forecast_cost_components (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  space_id uuid not null references public.spaces (id) on delete cascade,
  asset_id uuid references public.assets (id) on delete cascade,
  cost_basis numeric(14, 2) not null check (cost_basis >= 0),
  cost_basis_date date not null,
  refresh_cycle_years integer not null check (refresh_cycle_years > 0),
  recommended_replacement_year integer not null,
  inflation_rate numeric(8, 6) not null default 0.034 check (inflation_rate >= 0),
  forecast_amount numeric(14, 2) not null default 0 check (forecast_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index forecast_cost_components_organization_id_idx
  on public.forecast_cost_components (organization_id);

create index forecast_cost_components_space_id_idx
  on public.forecast_cost_components (space_id);

create table public.refresh_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  space_id uuid not null references public.spaces (id) on delete cascade,
  type public.refresh_event_type not null,
  event_date date not null,
  description text not null default '',
  cost numeric(14, 2) check (cost is null or cost >= 0),
  created_at timestamptz not null default now()
);

create index refresh_events_organization_id_idx
  on public.refresh_events (organization_id);

create index refresh_events_space_id_idx on public.refresh_events (space_id);

-- ---------------------------------------------------------------------------
-- Updated-at triggers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create trigger campuses_set_updated_at
  before update on public.campuses
  for each row execute function public.set_updated_at();

create trigger buildings_set_updated_at
  before update on public.buildings
  for each row execute function public.set_updated_at();

create trigger floors_set_updated_at
  before update on public.floors
  for each row execute function public.set_updated_at();

create trigger physical_locations_set_updated_at
  before update on public.physical_locations
  for each row execute function public.set_updated_at();

create trigger spaces_set_updated_at
  before update on public.spaces
  for each row execute function public.set_updated_at();

create trigger assets_set_updated_at
  before update on public.assets
  for each row execute function public.set_updated_at();

create trigger forecast_cost_components_set_updated_at
  before update on public.forecast_cost_components
  for each row execute function public.set_updated_at();
