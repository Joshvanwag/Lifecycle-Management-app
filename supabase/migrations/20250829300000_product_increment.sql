-- Product increment: import history, admin audit, saved report filters,
-- and a members listing helper. floors_enabled already exists on organizations.

create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  created_by uuid references auth.users (id),
  workflow text not null check (workflow in ('add', 'full_refresh', 'partial_refresh')),
  source_filename text,
  status text not null default 'completed' check (status in ('completed', 'failed')),
  spaces_created integer not null default 0,
  spaces_updated integer not null default 0,
  assets_created integer not null default 0,
  assets_updated integer not null default 0,
  assets_retired integer not null default 0,
  error_message text,
  created_at timestamptz not null default now()
);

create index import_jobs_organization_id_idx
  on public.import_jobs (organization_id, created_at desc);

alter table public.import_jobs enable row level security;

create policy "Members can read import_jobs"
  on public.import_jobs for select to authenticated
  using (public.can_read_organization(organization_id));

create policy "Writers can insert import_jobs"
  on public.import_jobs for insert to authenticated
  with check (public.can_write_organization(organization_id));

create table public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor_user_id uuid references auth.users (id),
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_events_organization_id_idx
  on public.admin_audit_events (organization_id, created_at desc);

alter table public.admin_audit_events enable row level security;

create policy "Members can read admin_audit_events"
  on public.admin_audit_events for select to authenticated
  using (public.can_read_organization(organization_id));

create policy "Managers can insert admin_audit_events"
  on public.admin_audit_events for insert to authenticated
  with check (public.can_manage_organization(organization_id) or public.can_write_organization(organization_id));

create table public.saved_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  report_key text not null,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index saved_reports_organization_id_idx
  on public.saved_reports (organization_id, user_id);

alter table public.saved_reports enable row level security;

create policy "Members can read own saved_reports"
  on public.saved_reports for select to authenticated
  using (
    public.can_read_organization(organization_id)
    and user_id = auth.uid()
  );

create policy "Members can insert own saved_reports"
  on public.saved_reports for insert to authenticated
  with check (
    public.can_read_organization(organization_id)
    and user_id = auth.uid()
  );

create policy "Members can delete own saved_reports"
  on public.saved_reports for delete to authenticated
  using (
    public.can_read_organization(organization_id)
    and user_id = auth.uid()
  );

create or replace function public.list_organization_members(target_organization_id uuid)
returns table (
  user_id uuid,
  email text,
  role public.membership_role,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    om.user_id,
    u.email::text,
    om.role,
    om.created_at
  from public.organization_memberships om
  join auth.users u on u.id = om.user_id
  where om.organization_id = target_organization_id
    and public.can_read_organization(target_organization_id);
$$;

revoke all on function public.list_organization_members(uuid) from public;
grant execute on function public.list_organization_members(uuid) to authenticated;
