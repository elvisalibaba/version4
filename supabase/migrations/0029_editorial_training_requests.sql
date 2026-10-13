create table if not exists public.editorial_training_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  country text,
  city text,
  organization_name text,
  profile_type text not null check (profile_type in ('author', 'aspiring_editor', 'publisher', 'entrepreneur', 'student', 'other')),
  experience_level text not null check (experience_level in ('beginner', 'intermediate', 'advanced')),
  project_stage text not null check (project_stage in ('idea', 'drafting', 'manuscript_ready', 'existing_catalog')),
  preferred_format text not null check (preferred_format in ('online', 'onsite', 'hybrid')),
  objectives text not null,
  message text,
  consent_to_contact boolean not null default true,
  source text not null default 'formation-editoriale',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists editorial_training_requests_created_at_idx
  on public.editorial_training_requests (created_at desc);

create index if not exists editorial_training_requests_email_idx
  on public.editorial_training_requests (email);

drop trigger if exists trg_editorial_training_requests_updated_at on public.editorial_training_requests;
create trigger trg_editorial_training_requests_updated_at
before update on public.editorial_training_requests
for each row execute procedure public.set_updated_at();

alter table public.editorial_training_requests enable row level security;

drop policy if exists "Anyone can create editorial training requests" on public.editorial_training_requests;
create policy "Anyone can create editorial training requests"
on public.editorial_training_requests
for insert
with check (user_id is null or user_id = auth.uid());

drop policy if exists "Admin full editorial training requests access" on public.editorial_training_requests;
create policy "Admin full editorial training requests access"
on public.editorial_training_requests
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());
