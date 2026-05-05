import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BookingWizard } from "@/components/booking/BookingWizard";

export default async function BookingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("users") as any)
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "secretary";
  const isAdmin = role === "admin";

  return (
    <div className="p-4 md:p-6">
      <BookingWizard isAdmin={isAdmin} userId={user.id} />
    </div>
  );
}
