import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LeadsManager } from "@/components/leads/LeadsManager";

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("users") as any)
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: leads } = await (supabase.from("leads") as any)
    .select("*, interests:lead_venue_interests(venue:venues(id,name))")
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: venues } = await (supabase.from("venues") as any)
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">לידים ולקוחות</h1>
      <LeadsManager leads={leads ?? []} venues={venues ?? []} />
    </div>
  );
}
