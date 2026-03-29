create extension if not exists pgcrypto;

do $$
begin
  create type public.role_type as enum ('ADMIN', 'STUDENT');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.stage_key_type as enum (
    'title-proposal',
    'chapter-1',
    'chapter-2',
    'chapter-3',
    'data-gathering',
    'data-analysis',
    'chapter-4-5',
    'final-defense'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.stage_status_type as enum (
    'NOT_STARTED',
    'SUBMITTED',
    'UNDER_REVIEW',
    'REVISED',
    'APPROVED'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.submission_type as enum ('FILE', 'TEXT');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.comment_category_type as enum (
    'MAJOR_REVISION',
    'MINOR_REVISION',
    'APPROVED'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.task_status_type as enum ('PENDING', 'COMPLETED');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.resource_category_type as enum (
    'TEMPLATE',
    'RUBRIC',
    'SAMPLE_PAPER',
    'VIDEO_GUIDE'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.notification_type as enum (
    'FEEDBACK',
    'REVISION_TASK',
    'RESOURCE',
    'STATUS',
    'SUBMISSION'
  );
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN', false);
$$;

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.role_type not null default 'STUDENT',
  name text not null,
  email text not null unique,
  group_id uuid references public.groups(id) on delete set null,
  email_alerts boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_login_at timestamptz
);

create table if not exists public.stages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  stage_key public.stage_key_type not null,
  status public.stage_status_type not null default 'NOT_STARTED',
  due_date timestamptz not null,
  updated_at timestamptz not null default timezone('utc', now()),
  last_submission_at timestamptz,
  last_reviewed_at timestamptz,
  unique (group_id, stage_key)
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  stage_key public.stage_key_type not null,
  version integer not null,
  submission_type public.submission_type not null,
  file_name text,
  file_path text,
  content text,
  uploaded_by_user_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  unique (group_id, stage_key, version)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  stage_key public.stage_key_type not null,
  section text not null,
  category public.comment_category_type not null,
  text text not null,
  created_by_user_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  addressed_at timestamptz,
  addressed_by_user_id uuid references public.profiles(id) on delete set null
);

create table if not exists public.comment_replies (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete restrict,
  text text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  stage_key public.stage_key_type not null,
  comment_id uuid not null unique references public.comments(id) on delete cascade,
  description text not null,
  status public.task_status_type not null default 'PENDING',
  student_response text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  category public.resource_category_type not null,
  title text not null,
  description text not null,
  file_name text,
  file_path text,
  external_url text,
  uploaded_by_user_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type public.notification_type not null,
  title text not null,
  message text not null,
  group_id uuid references public.groups(id) on delete cascade,
  stage_key public.stage_key_type,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notification_recipients (
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  read_at timestamptz,
  primary key (notification_id, user_id)
);

create index if not exists idx_profiles_group_id on public.profiles(group_id);
create index if not exists idx_stages_group_id on public.stages(group_id);
create index if not exists idx_submissions_group_stage on public.submissions(group_id, stage_key);
create index if not exists idx_comments_group_stage on public.comments(group_id, stage_key);
create index if not exists idx_tasks_group_stage on public.tasks(group_id, stage_key);
create index if not exists idx_notification_recipients_user_id on public.notification_recipients(user_id);
create unique index if not exists idx_resources_title_unique on public.resources(title);

create or replace function public.is_in_group(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.group_id = target_group_id
  );
$$;

drop trigger if exists trg_groups_updated_at on public.groups;
create trigger trg_groups_updated_at
before update on public.groups
for each row execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_stages_updated_at on public.stages;
create trigger trg_stages_updated_at
before update on public.stages
for each row execute function public.set_updated_at();

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

alter table public.groups enable row level security;
alter table public.profiles enable row level security;
alter table public.stages enable row level security;
alter table public.submissions enable row level security;
alter table public.comments enable row level security;
alter table public.comment_replies enable row level security;
alter table public.tasks enable row level security;
alter table public.resources enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_recipients enable row level security;

drop policy if exists "admins manage groups" on public.groups;
create policy "admins manage groups"
on public.groups
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "group members view groups" on public.groups;
create policy "group members view groups"
on public.groups
for select
using (public.is_admin() or public.is_in_group(id));

drop policy if exists "admins manage profiles" on public.profiles;
create policy "admins manage profiles"
on public.profiles
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "group members view stages" on public.stages;
create policy "group members view stages"
on public.stages
for select
using (public.is_admin() or public.is_in_group(group_id));

drop policy if exists "admins manage stages" on public.stages;
create policy "admins manage stages"
on public.stages
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "group members view submissions" on public.submissions;
create policy "group members view submissions"
on public.submissions
for select
using (public.is_admin() or public.is_in_group(group_id));

drop policy if exists "group members create submissions" on public.submissions;
create policy "group members create submissions"
on public.submissions
for insert
with check (public.is_admin() or public.is_in_group(group_id));

drop policy if exists "group members view comments" on public.comments;
create policy "group members view comments"
on public.comments
for select
using (public.is_admin() or public.is_in_group(group_id));

drop policy if exists "admins manage comments" on public.comments;
create policy "admins manage comments"
on public.comments
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "group members view replies" on public.comment_replies;
create policy "group members view replies"
on public.comment_replies
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.comments
    where comments.id = comment_replies.comment_id
      and public.is_in_group(comments.group_id)
  )
);

drop policy if exists "group members create replies" on public.comment_replies;
create policy "group members create replies"
on public.comment_replies
for insert
with check (
  public.is_admin()
  or exists (
    select 1
    from public.comments
    where comments.id = comment_replies.comment_id
      and public.is_in_group(comments.group_id)
  )
);

drop policy if exists "group members view tasks" on public.tasks;
create policy "group members view tasks"
on public.tasks
for select
using (public.is_admin() or public.is_in_group(group_id));

drop policy if exists "students update own group tasks" on public.tasks;
create policy "students update own group tasks"
on public.tasks
for update
using (public.is_admin() or public.is_in_group(group_id))
with check (public.is_admin() or public.is_in_group(group_id));

drop policy if exists "admins insert tasks" on public.tasks;
create policy "admins insert tasks"
on public.tasks
for insert
with check (public.is_admin());

drop policy if exists "authenticated users view resources" on public.resources;
create policy "authenticated users view resources"
on public.resources
for select
using (auth.uid() is not null);

drop policy if exists "admins manage resources" on public.resources;
create policy "admins manage resources"
on public.resources
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "recipients view notifications" on public.notifications;
create policy "recipients view notifications"
on public.notifications
for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.notification_recipients
    where notification_recipients.notification_id = notifications.id
      and notification_recipients.user_id = auth.uid()
  )
);

drop policy if exists "admins create notifications" on public.notifications;
create policy "admins create notifications"
on public.notifications
for insert
with check (public.is_admin());

drop policy if exists "recipients view notification recipients" on public.notification_recipients;
create policy "recipients view notification recipients"
on public.notification_recipients
for select
using (public.is_admin() or user_id = auth.uid());

drop policy if exists "admins manage notification recipients" on public.notification_recipients;
create policy "admins manage notification recipients"
on public.notification_recipients
for all
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('submission-files', 'submission-files', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('resource-files', 'resource-files', false)
on conflict (id) do nothing;

do $$
begin
  alter publication supabase_realtime add table public.notification_recipients;
exception
  when duplicate_object then null;
end $$;
