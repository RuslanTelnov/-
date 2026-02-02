
create table if not exists sync_state (
  id uuid default gen_random_uuid() primary key,
  entity_type text not null unique,
  last_sync_start timestamptz,
  last_sync_end timestamptz,
  status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add RLS policies
alter table sync_state enable row level security;

create policy "Enable read access for authenticated users"
on sync_state for select
to authenticated
using (true);

create policy "Enable insert/update for authenticated users"
on sync_state for all
to authenticated
using (true)
with check (true);
