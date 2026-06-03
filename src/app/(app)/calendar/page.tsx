import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/supabase/queries";
import { VenueCalendarClient } from "@/components/calendar/VenueCalendarClient";
import type { VenueRow, EventRow, UserRole } from "@/types/database";

export default async function CalendarPage() {
  const { supabase, user, profile } = await getUserProfile();
  if (profile.role === "secretary") redirect("/events");
  const role = profile.role as UserRole;

  // Admins see all venues; owners see only their own
  const venueQuery = supabase.from("venues").select("id, name").eq("is_active", true).order("name");
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
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <h1 className="text-2xl font-bold shrink-0">יומן אירועים</h1>
      <VenueCalendarClient
        venues={venues as Pick<VenueRow, "id" | "name">[]}
        initialEvents={events ?? []}
        userId={user.id}
        role={role}
      />
    </div>
  );
}
