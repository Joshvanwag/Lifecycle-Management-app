-- Phase 2: Row Level Security policies

-- ---------------------------------------------------------------------------
-- Helper functions (security definer — query membership, not user data)
-- ---------------------------------------------------------------------------

create or replace function public.user_organization_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.organization_memberships
  where user_id = auth.uid();
$$;

create or replace function public.user_membership_role(target_organization_id uuid)
returns public.membership_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.organization_memberships
  where user_id = auth.uid()
    and organization_id = target_organization_id
  limit 1;
$$;

create or replace function public.can_read_organization(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships
    where user_id = auth.uid()
      and organization_id = target_organization_id
  );
$$;

create or replace function public.can_write_organization(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships
    where user_id = auth.uid()
      and organization_id = target_organization_id
      and role in ('owner', 'admin', 'member')
  );
$$;

create or replace function public.can_manage_organization(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships
    where user_id = auth.uid()
      and organization_id = target_organization_id
      and role in ('owner', 'admin')
  );
$$;

revoke all on function public.user_organization_ids() from public;
revoke all on function public.user_membership_role(uuid) from public;
revoke all on function public.can_read_organization(uuid) from public;
revoke all on function public.can_write_organization(uuid) from public;
revoke all on function public.can_manage_organization(uuid) from public;

grant execute on function public.user_organization_ids() to authenticated;
grant execute on function public.user_membership_role(uuid) to authenticated;
grant execute on function public.can_read_organization(uuid) to authenticated;
grant execute on function public.can_write_organization(uuid) to authenticated;
grant execute on function public.can_manage_organization(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS on all tenant tables
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.campuses enable row level security;
alter table public.buildings enable row level security;
alter table public.floors enable row level security;
alter table public.physical_locations enable row level security;
alter table public.spaces enable row level security;
alter table public.space_locations enable row level security;
alter table public.assets enable row level security;
alter table public.forecast_cost_components enable row level security;
alter table public.refresh_events enable row level security;

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------

create policy "Members can read their organizations"
  on public.organizations
  for select
  to authenticated
  using (id in (select public.user_organization_ids()));

create policy "Owners and admins can update their organizations"
  on public.organizations
  for update
  to authenticated
  using (public.can_manage_organization(id))
  with check (public.can_manage_organization(id));

-- Inserts happen via security-definer signup trigger only.

-- ---------------------------------------------------------------------------
-- organization_memberships
-- ---------------------------------------------------------------------------

create policy "Members can read memberships in their organizations"
  on public.organization_memberships
  for select
  to authenticated
  using (organization_id in (select public.user_organization_ids()));

create policy "Owners and admins can manage memberships"
  on public.organization_memberships
  for all
  to authenticated
  using (public.can_manage_organization(organization_id))
  with check (public.can_manage_organization(organization_id));

-- ---------------------------------------------------------------------------
-- Generic tenant table policies (read / write split for read_only role)
-- ---------------------------------------------------------------------------

create policy "Members can read campuses"
  on public.campuses for select to authenticated
  using (organization_id in (select public.user_organization_ids()));

create policy "Writers can insert campuses"
  on public.campuses for insert to authenticated
  with check (public.can_write_organization(organization_id));

create policy "Writers can update campuses"
  on public.campuses for update to authenticated
  using (public.can_write_organization(organization_id))
  with check (public.can_write_organization(organization_id));

create policy "Writers can delete campuses"
  on public.campuses for delete to authenticated
  using (public.can_write_organization(organization_id));

create policy "Members can read buildings"
  on public.buildings for select to authenticated
  using (organization_id in (select public.user_organization_ids()));

create policy "Writers can insert buildings"
  on public.buildings for insert to authenticated
  with check (public.can_write_organization(organization_id));

create policy "Writers can update buildings"
  on public.buildings for update to authenticated
  using (public.can_write_organization(organization_id))
  with check (public.can_write_organization(organization_id));

create policy "Writers can delete buildings"
  on public.buildings for delete to authenticated
  using (public.can_write_organization(organization_id));

create policy "Members can read floors"
  on public.floors for select to authenticated
  using (organization_id in (select public.user_organization_ids()));

create policy "Writers can insert floors"
  on public.floors for insert to authenticated
  with check (public.can_write_organization(organization_id));

create policy "Writers can update floors"
  on public.floors for update to authenticated
  using (public.can_write_organization(organization_id))
  with check (public.can_write_organization(organization_id));

create policy "Writers can delete floors"
  on public.floors for delete to authenticated
  using (public.can_write_organization(organization_id));

create policy "Members can read physical_locations"
  on public.physical_locations for select to authenticated
  using (organization_id in (select public.user_organization_ids()));

create policy "Writers can insert physical_locations"
  on public.physical_locations for insert to authenticated
  with check (public.can_write_organization(organization_id));

create policy "Writers can update physical_locations"
  on public.physical_locations for update to authenticated
  using (public.can_write_organization(organization_id))
  with check (public.can_write_organization(organization_id));

create policy "Writers can delete physical_locations"
  on public.physical_locations for delete to authenticated
  using (public.can_write_organization(organization_id));

create policy "Members can read spaces"
  on public.spaces for select to authenticated
  using (organization_id in (select public.user_organization_ids()));

create policy "Writers can insert spaces"
  on public.spaces for insert to authenticated
  with check (public.can_write_organization(organization_id));

create policy "Writers can update spaces"
  on public.spaces for update to authenticated
  using (public.can_write_organization(organization_id))
  with check (public.can_write_organization(organization_id));

create policy "Writers can delete spaces"
  on public.spaces for delete to authenticated
  using (public.can_write_organization(organization_id));

create policy "Members can read space_locations"
  on public.space_locations for select to authenticated
  using (organization_id in (select public.user_organization_ids()));

create policy "Writers can insert space_locations"
  on public.space_locations for insert to authenticated
  with check (public.can_write_organization(organization_id));

create policy "Writers can update space_locations"
  on public.space_locations for update to authenticated
  using (public.can_write_organization(organization_id))
  with check (public.can_write_organization(organization_id));

create policy "Writers can delete space_locations"
  on public.space_locations for delete to authenticated
  using (public.can_write_organization(organization_id));

create policy "Members can read assets"
  on public.assets for select to authenticated
  using (organization_id in (select public.user_organization_ids()));

create policy "Writers can insert assets"
  on public.assets for insert to authenticated
  with check (public.can_write_organization(organization_id));

create policy "Writers can update assets"
  on public.assets for update to authenticated
  using (public.can_write_organization(organization_id))
  with check (public.can_write_organization(organization_id));

create policy "Writers can delete assets"
  on public.assets for delete to authenticated
  using (public.can_write_organization(organization_id));

create policy "Members can read forecast_cost_components"
  on public.forecast_cost_components for select to authenticated
  using (organization_id in (select public.user_organization_ids()));

create policy "Writers can insert forecast_cost_components"
  on public.forecast_cost_components for insert to authenticated
  with check (public.can_write_organization(organization_id));

create policy "Writers can update forecast_cost_components"
  on public.forecast_cost_components for update to authenticated
  using (public.can_write_organization(organization_id))
  with check (public.can_write_organization(organization_id));

create policy "Writers can delete forecast_cost_components"
  on public.forecast_cost_components for delete to authenticated
  using (public.can_write_organization(organization_id));

create policy "Members can read refresh_events"
  on public.refresh_events for select to authenticated
  using (organization_id in (select public.user_organization_ids()));

create policy "Writers can insert refresh_events"
  on public.refresh_events for insert to authenticated
  with check (public.can_write_organization(organization_id));

create policy "Writers can update refresh_events"
  on public.refresh_events for update to authenticated
  using (public.can_write_organization(organization_id))
  with check (public.can_write_organization(organization_id));

create policy "Writers can delete refresh_events"
  on public.refresh_events for delete to authenticated
  using (public.can_write_organization(organization_id));
