import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { VenueCalendar } from "@/components/calendar/VenueCalendar";
import type { VenueRow, EventRow, UserRole } from "@/types/database";

export default async function CalendarPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single() as { data: { role: string } | null };

  const role = (profile?.role ?? "venue_owner") as UserRole;

  // Admins see all venues; owners see only their own
  const venueQuery = supabase.from("venues").select("*").eq("is_active", true).order("name");
  if (role === "venue_owner") venueQuery.eq("owner_user_id", user.id);

  const { data: venues } = await venueQuery as { data: VenueRow[] | null };

  if (!venues?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground gap-2">
        <p className="text-lg font-medium">אין אולמות מקושרים לחשבון שלך</p>
        <p className="text-sm">צור קשר עם המנהל להוספת אולם</p>
      </div>
    );
  }

  const venueIds = venues.map((v) => v.id);
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .in("venue_id", venueIds)
    .neq("status", "cancelled")
    .order("date") as { data: EventRow[] | null };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">יומן אירועים</h1>
      <VenueCalendar
        venues={venues}
        initialEvents={events ?? []}
        userId={user.id}
        role={role}
      />
    </div>
  );
}
