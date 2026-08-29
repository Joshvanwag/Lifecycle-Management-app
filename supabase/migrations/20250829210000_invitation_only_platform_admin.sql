-- Invitation-only onboarding and platform admin access
-- Users cannot self-provision organizations. Platform admins (app_metadata.platform_admin)
-- have cross-tenant read/write access and bypass benchmark contributor thresholds.

-- ---------------------------------------------------------------------------
-- Invitations
-- ---------------------------------------------------------------------------

create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  role public.membership_role not null default 'member',
  token uuid not null unique default gen_random_uuid(),
  invited_by uuid references auth.users (id) on delete set null,
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint organization_invitations_email_not_blank check (length(trim(email)) > 0)
);

create index organization_invitations_organization_id_idx
  on public.organization_invitations (organization_id);

create index organization_invitations_email_lower_idx
  on public.organization_invitations (lower(email));

create unique index organization_invitations_pending_unique_idx
  on public.organization_invitations (organization_id, lower(email))
  where accepted_at is null and revoked_at is null;

alter table public.organization_invitations enable row level security;

-- ---------------------------------------------------------------------------
-- Platform admin helper (uses app_metadata — not user-editable user_metadata)
-- ---------------------------------------------------------------------------

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'platform_admin')::boolean,
    false
  );
$$;

revoke all on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Update tenant helper functions for platform admin cross-tenant access
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
  where user_id = auth.uid()
  union
  select id
  from public.organizations
  where public.is_platform_admin();
$$;

create or replace function public.can_read_organization(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin()
    or exists (
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
  select public.is_platform_admin()
    or exists (
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
  select public.is_platform_admin()
    or exists (
      select 1
      from public.organization_memberships
      where user_id = auth.uid()
        and organization_id = target_organization_id
        and role in ('owner', 'admin')
    );
$$;

-- ---------------------------------------------------------------------------
-- Invitation helpers
-- ---------------------------------------------------------------------------

create or replace function public.accept_pending_invitations()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
  user_email text;
begin
  select email into user_email
  from auth.users
  where id = auth.uid();

  if user_email is null then
    return null;
  end if;

  select *
  into inv
  from public.organization_invitations
  where lower(email) = lower(user_email)
    and accepted_at is null
    and revoked_at is null
    and expires_at > now()
  order by created_at desc
  limit 1;

  if inv is null then
    return null;
  end if;

  insert into public.organization_memberships (organization_id, user_id, role)
  values (inv.organization_id, auth.uid(), inv.role)
  on conflict (organization_id, user_id) do update
    set role = excluded.role;

  update public.organization_invitations
  set accepted_at = now()
  where id = inv.id;

  return inv.organization_id;
end;
$$;

revoke all on function public.accept_pending_invitations() from public;
grant execute on function public.accept_pending_invitations() to authenticated;

create or replace function public.get_invitation_preview(p_token uuid)
returns table (
  email text,
  organization_name text,
  role public.membership_role,
  expires_at timestamptz,
  is_valid boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    i.email,
    o.name as organization_name,
    i.role,
    i.expires_at,
    (
      i.accepted_at is null
      and i.revoked_at is null
      and i.expires_at > now()
    ) as is_valid
  from public.organization_invitations i
  join public.organizations o on o.id = i.organization_id
  where i.token = p_token;
$$;

revoke all on function public.get_invitation_preview(uuid) from public;
grant execute on function public.get_invitation_preview(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Signup trigger — link invited users only (no self-service organizations)
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
begin
  select *
  into inv
  from public.organization_invitations
  where lower(email) = lower(new.email)
    and accepted_at is null
    and revoked_at is null
    and expires_at > now()
  order by created_at desc
  limit 1;

  if inv is null then
    return new;
  end if;

  insert into public.organization_memberships (organization_id, user_id, role)
  values (inv.organization_id, new.id, inv.role)
  on conflict (organization_id, user_id) do update
    set role = excluded.role;

  update public.organization_invitations
  set accepted_at = now()
  where id = inv.id;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Invitation RLS
-- ---------------------------------------------------------------------------

create policy "Managers can read invitations for their organizations"
  on public.organization_invitations
  for select
  to authenticated
  using (
    public.is_platform_admin()
    or public.can_manage_organization(organization_id)
  );

create policy "Managers can create invitations"
  on public.organization_invitations
  for insert
  to authenticated
  with check (
    public.is_platform_admin()
    or public.can_manage_organization(organization_id)
  );

create policy "Managers can revoke pending invitations"
  on public.organization_invitations
  for update
  to authenticated
  using (
    public.is_platform_admin()
    or public.can_manage_organization(organization_id)
  )
  with check (
    public.is_platform_admin()
    or public.can_manage_organization(organization_id)
  );

-- ---------------------------------------------------------------------------
-- Platform admin benchmark access (under-5 rule bypass for app owner/dev only)
-- Customer-facing get_benchmark_metrics_public() is unchanged.
-- ---------------------------------------------------------------------------

create or replace function public.get_benchmark_metrics_admin(
  p_industry_type text default null,
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
  contributor_count integer,
  is_eligible boolean,
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
    b.contributor_count,
    b.is_eligible,
    b.computed_at
  from public.benchmark_aggregate_metrics b
  where public.is_platform_admin()
    and (p_industry_type is null or b.industry_type = p_industry_type)
    and (p_metric_code is null or b.metric_code = p_metric_code)
    and (p_space_type is null or b.space_type is not distinct from p_space_type)
    and (p_asset_category is null or b.asset_category is not distinct from p_asset_category)
    and (p_period_year is null or b.period_year is not distinct from p_period_year);
$$;

revoke all on function public.get_benchmark_metrics_admin(text, text, text, text, integer) from public;
grant execute on function public.get_benchmark_metrics_admin(text, text, text, text, integer) to authenticated;

create policy "Platform admins can read all organization benchmark values"
  on public.organization_benchmark_values
  for select
  to authenticated
  using (public.is_platform_admin());

grant select on table public.benchmark_aggregate_metrics to authenticated;

create policy "Platform admins can read benchmark aggregates directly"
  on public.benchmark_aggregate_metrics
  for select
  to authenticated
  using (public.is_platform_admin());

comment on function public.get_benchmark_metrics_admin is
  'Platform admin only. Returns all benchmark aggregates including sub-threshold contributor counts. Regular org owners continue using get_benchmark_metrics_public().';
