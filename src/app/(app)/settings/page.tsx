import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UsersManager } from "@/components/settings/UsersManager";

export default async function SettingsPage() {
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
  const { data: users } = await (supabase.from("users") as any)
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">ניהול משתמשים</h1>
      <UsersManager users={users ?? []} currentUserId={user.id} />
    </div>
  );
}
