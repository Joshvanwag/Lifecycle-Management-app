-- Phase 4: reusable import column mappings per organization

create table public.import_mappings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  workflow text not null check (
    workflow in ('add', 'full_refresh', 'partial_refresh', 'correct')
  ),
  column_map jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index import_mappings_organization_id_idx
  on public.import_mappings (organization_id);

create unique index import_mappings_org_name_workflow_idx
  on public.import_mappings (organization_id, lower(name), workflow);

alter table public.import_mappings enable row level security;

create policy "Members can read import_mappings"
  on public.import_mappings for select to authenticated
  using (public.can_read_organization(organization_id));

create policy "Writers can insert import_mappings"
  on public.import_mappings for insert to authenticated
  with check (public.can_write_organization(organization_id));

create policy "Writers can update import_mappings"
  on public.import_mappings for update to authenticated
  using (public.can_write_organization(organization_id))
  with check (public.can_write_organization(organization_id));

create policy "Writers can delete import_mappings"
  on public.import_mappings for delete to authenticated
  using (public.can_write_organization(organization_id));
