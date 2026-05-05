import { createClient } from "@/lib/supabase/server";
import { VenueForm } from "@/components/venues/VenueForm";
import type { UserRow } from "@/types/database";

export default async function NewVenuePage() {
  const supabase = await createClient();

  const { data: owners } = await supabase
    .from("users")
    .select("id, full_name, email")
    .eq("role", "venue_owner")
    .order("full_name") as { data: Pick<UserRow, "id" | "full_name" | "email">[] | null };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">הוספת אולם חדש</h1>
        <p className="text-sm text-muted-foreground mt-1">מלא את הפרטים להוספת אולם למערכת</p>
      </div>
      <VenueForm owners={owners ?? []} />
    </div>
  );
}
