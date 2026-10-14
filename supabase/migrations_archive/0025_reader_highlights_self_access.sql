alter table public.highlights enable row level security;

drop policy if exists "Readers can view own highlights" on public.highlights;
create policy "Readers can view own highlights"
on public.highlights
for select
using (auth.uid() = user_id);

drop policy if exists "Readers can insert own highlights" on public.highlights;
create policy "Readers can insert own highlights"
on public.highlights
for insert
with check (auth.uid() = user_id);

drop policy if exists "Readers can update own highlights" on public.highlights;
create policy "Readers can update own highlights"
on public.highlights
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Readers can delete own highlights" on public.highlights;
create policy "Readers can delete own highlights"
on public.highlights
for delete
using (auth.uid() = user_id);
