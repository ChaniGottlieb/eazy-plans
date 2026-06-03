import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/supabase/queries";
import { BookingWizard } from "@/components/booking/BookingWizard";

export default async function BookingPage() {
  const { user, profile } = await getUserProfile();
  if (profile.role === "venue_owner") redirect("/calendar");
  const isAdmin = profile.role === "admin";

  return (
    <div className="p-4 md:p-6 flex-1 flex flex-col min-h-0">
      <BookingWizard isAdmin={isAdmin} userId={user.id} />
    </div>
  );
}
