import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import type { UserRole } from "@/types/database";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, full_name")
    .eq("id", user.id)
    .single() as { data: { role: string; full_name: string } | null };

  if (!profile) redirect("/login");

  return (
    <div className="flex h-screen">
      <Sidebar role={profile.role as UserRole} fullName={profile.full_name} />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
