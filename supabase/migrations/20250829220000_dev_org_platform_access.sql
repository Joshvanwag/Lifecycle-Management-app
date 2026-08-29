-- DEV organization: cross-tenant platform access via membership (not app_metadata).
-- Members of the single DEV org (is_dev_org = true) receive platform-wide access.

alter table public.organizations
  add column if not exists is_dev_org boolean not null default false;

create unique index if not exists organizations_single_dev_org_idx
  on public.organizations (is_dev_org)
  where is_dev_org = true;

comment on column public.organizations.is_dev_org is
  'When true, organization members receive cross-tenant platform access. At most one DEV org.';

-- Prevent clients from toggling the DEV org flag or creating a second DEV org.
create or replace function public.guard_dev_org_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' and NEW.is_dev_org = true then
    if exists (select 1 from public.organizations where is_dev_org = true) then
      raise exception 'DEV organization already exists';
    end if;
  end if;

  if TG_OP = 'UPDATE' and NEW.is_dev_org is distinct from OLD.is_dev_org then
    raise exception 'DEV organization flag cannot be changed';
  end if;

  return NEW;
end;
$$;

drop trigger if exists organizations_guard_dev_org_flag on public.organizations;
create trigger organizations_guard_dev_org_flag
  before insert or update on public.organizations
  for each row
  execute function public.guard_dev_org_flag();

-- Platform access = member of the DEV org (replaces app_metadata.platform_admin).
create or replace function public.is_platform_admin()
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
      and o.is_dev_org = true
  );
$$;

-- Provision DEV org and owner access for the app operator.
do $$
declare
  dev_org_id uuid;
  owner_user_id uuid;
begin
  select id into dev_org_id
  from public.organizations
  where is_dev_org = true
  limit 1;

  if dev_org_id is null then
    insert into public.organizations (name, industry_type, benchmark_participation, is_dev_org)
    values ('DEV', 'other', false, true)
    returning id into dev_org_id;
  end if;

  select id into owner_user_id
  from auth.users
  where lower(email) = lower('vanwagenenjosh@gmail.com')
  limit 1;

  if owner_user_id is not null then
    insert into public.organization_memberships (organization_id, user_id, role)
    values (dev_org_id, owner_user_id, 'owner')
    on conflict (organization_id, user_id) do update
      set role = 'owner';
  elsif not exists (
    select 1
    from public.organization_invitations
    where organization_id = dev_org_id
      and lower(email) = lower('vanwagenenjosh@gmail.com')
      and accepted_at is null
      and revoked_at is null
  ) then
    insert into public.organization_invitations (organization_id, email, role)
    values (dev_org_id, 'vanwagenenjosh@gmail.com', 'owner');
  end if;
end;
$$;
