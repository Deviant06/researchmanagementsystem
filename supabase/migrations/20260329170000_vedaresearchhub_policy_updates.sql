do $$
begin
  create type public.resource_audience_type as enum ('ALL', 'ADMIN_ONLY');
exception
  when duplicate_object then null;
end $$;

alter table public.resources
add column if not exists audience public.resource_audience_type not null default 'ALL';

drop policy if exists "authenticated users view resources" on public.resources;
create policy "users view allowed resources"
on public.resources
for select
using (
  public.is_admin()
  or audience = 'ALL'
);
