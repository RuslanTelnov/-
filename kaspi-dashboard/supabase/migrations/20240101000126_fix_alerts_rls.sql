-- Enable read access to alerts table for authenticated and anon users
alter table "public"."alerts" enable row level security;

create policy "Enable read access for all users"
on "public"."alerts"
as permissive
for select
to public
using (true);

-- Grant access to the table
grant select on table "public"."alerts" to anon, authenticated, service_role;
