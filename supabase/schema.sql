-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Projects table
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  color text not null default '#3B82F6',
  archived boolean not null default false,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null
);

alter table public.projects enable row level security;

create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

-- Tags table
create table public.tags (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(name, user_id)
);

alter table public.tags enable row level security;

create policy "Users can view own tags"
  on public.tags for select
  using (auth.uid() = user_id);

create policy "Users can insert own tags"
  on public.tags for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own tags"
  on public.tags for delete
  using (auth.uid() = user_id);

-- Time entries table
create table public.time_entries (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  start_time timestamptz not null,
  end_time timestamptz,
  tag text,
  note text,
  created_at timestamptz default now() not null
);

alter table public.time_entries enable row level security;

create policy "Users can view own entries"
  on public.time_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own entries"
  on public.time_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own entries"
  on public.time_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete own entries"
  on public.time_entries for delete
  using (auth.uid() = user_id);

-- Index for fast weekly queries
create index time_entries_user_date_idx
  on public.time_entries (user_id, start_time desc);

-- Storage bucket for reports
insert into storage.buckets (id, name, public)
values ('reports', 'reports', false);

create policy "Users can read own reports"
  on storage.objects for select
  using (auth.uid()::text = (storage.foldername(name))[1]);

create policy "Service role can insert reports"
  on storage.objects for insert
  with check (bucket_id = 'reports');
