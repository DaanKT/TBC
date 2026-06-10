-- Migratie: directe berichten (DM)
-- Uitvoeren in: Supabase Dashboard → SQL Editor

create table if not exists public.direct_messages (
  id          uuid        default gen_random_uuid() primary key,
  sender_id   uuid        references public.profielen(id) on delete cascade not null,
  receiver_id uuid        references public.profielen(id) on delete cascade not null,
  message     text        not null,
  created_at  timestamptz default now() not null
);

-- Row Level Security: gebruikers zien alleen hun eigen DMs
alter table public.direct_messages enable row level security;

create policy "dm_select"
  on public.direct_messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "dm_insert"
  on public.direct_messages for insert
  with check (auth.uid() = sender_id);

-- Realtime inschakelen voor de tabel
alter publication supabase_realtime add table public.direct_messages;
