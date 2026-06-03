-- Allow secretaries to read and manage leads (same as admin)
drop policy "leads_admin_only" on leads;
drop policy "lead_venue_interests_admin_only" on lead_venue_interests;

create policy "leads_admin_secretary" on leads
  for all using (current_user_role() in ('admin', 'secretary'));

create policy "lead_venue_interests_admin_secretary" on lead_venue_interests
  for all using (current_user_role() in ('admin', 'secretary'));
