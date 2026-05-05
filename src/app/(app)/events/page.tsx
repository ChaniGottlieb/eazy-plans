import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EventsTable } from "@/components/events/EventsTable";

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("users") as any)
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "secretary";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("events") as any)
    .select("*, venue:venues(id, name, city), creator:users!created_by(full_name)")
    .order("date", { ascending: false });

  // Venue owners see only their venues' events
  if (role === "venue_owner") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: myVenues } = await (supabase.from("venues") as any)
      .select("id")
      .eq("owner_user_id", user.id);
    const ids = (myVenues ?? []).map((v: { id: string }) => v.id);
    if (ids.length === 0) {
      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">ניהול אירועים</h1>
          <p className="text-muted-foreground">אין אולמות ברשותך.</p>
        </div>
      );
    }
    query = query.in("venue_id", ids);
  }

  const { data: events } = await query;

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">ניהול אירועים</h1>
      <EventsTable events={events ?? []} role={role} currentUserId={user.id} />
    </div>
  );
}
