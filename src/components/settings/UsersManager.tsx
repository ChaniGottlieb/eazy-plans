"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import type { UserRole } from "@/types/database";
import { useRouter } from "next/navigation";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "מנהל",
  secretary: "מזכירה",
  venue_owner: "בעל אולם",
};

const ROLE_VARIANT: Record<UserRole, "default" | "secondary" | "outline"> = {
  admin: "default",
  secretary: "secondary",
  venue_owner: "outline",
};

type UserRow = { id: string; email: string; full_name: string; role: UserRole; created_at: string };

interface UsersManagerProps {
  users: UserRow[];
  currentUserId: string;
}

export function UsersManager({ users: initialUsers, currentUserId }: UsersManagerProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", full_name: "", role: "secretary" as UserRole });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", role: "secretary" as UserRole });
  const [editLoading, setEditLoading] = useState(false);

  function openEdit(u: UserRow) {
    setEditForm({ full_name: u.full_name, role: u.role });
    setEditUser(u);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setEditLoading(true);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("users") as any)
      .update({ full_name: editForm.full_name, role: editForm.role })
      .eq("id", editUser.id);
    setEditLoading(false);

    if (error) { toast.error("שגיאה בשמירת הפרטים"); return; }

    setUsers((prev) => prev.map((u) =>
      u.id === editUser.id ? { ...u, full_name: editForm.full_name, role: editForm.role } : u
    ));
    toast.success("הפרטים עודכנו");
    setEditUser(null);
    router.refresh();
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true);
    const supabase = createClient();
    const tempPassword = Math.random().toString(36).slice(-12) + "Aa1!";
    const { error } = await supabase.auth.signUp({
      email: inviteForm.email,
      password: tempPassword,
      options: { data: { full_name: inviteForm.full_name, role: inviteForm.role } },
    });
    setInviteLoading(false);

    if (error) { toast.error("שגיאה ביצירת משתמש: " + error.message); return; }

    toast.success("המשתמש נוצר. יש לשלוח לו/לה את הסיסמה הזמנית ידנית.");
    setInviteOpen(false);
    setInviteForm({ email: "", full_name: "", role: "secretary" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Edit dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>עריכת משתמש</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>שם מלא *</Label>
              <Input
                value={editForm.full_name}
                onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>אימייל</Label>
              <Input value={editUser?.email ?? ""} dir="ltr" disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">לא ניתן לשנות אימייל מכאן</p>
            </div>
            <div className="space-y-1">
              <Label>תפקיד *</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) => setEditForm((f) => ({ ...f, role: v as UserRole }))}
                disabled={editUser?.id === currentUserId}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editUser?.id === currentUserId && (
                <p className="text-xs text-muted-foreground">לא ניתן לשנות את התפקיד שלך</p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={editLoading} className="flex-1">
                {editLoading ? "שומר..." : "שמור שינויים"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditUser(null)}>ביטול</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{users.length} משתמשים</p>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>הוסף משתמש</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>הוספת משתמש חדש</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label>שם מלא *</Label>
                <Input
                  value={inviteForm.full_name}
                  onChange={(e) => setInviteForm((f) => ({ ...f, full_name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>אימייל *</Label>
                <Input
                  type="email"
                  dir="ltr"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>תפקיד *</Label>
                <Select value={inviteForm.role} onValueChange={(v) => setInviteForm((f) => ({ ...f, role: v as UserRole }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                המשתמש ייווצר עם סיסמה זמנית. יש לשלוח לו/לה את הסיסמה ידנית ולבקש לשנות אותה.
              </p>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={inviteLoading} className="flex-1">
                  {inviteLoading ? "יוצר..." : "צור משתמש"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>ביטול</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table (desktop) */}
      <div className="hidden md:block overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-right px-4 py-3 font-medium">שם</th>
              <th className="text-right px-4 py-3 font-medium">אימייל</th>
              <th className="text-right px-4 py-3 font-medium">תפקיד</th>
              <th className="text-right px-4 py-3 font-medium">נוצר</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t hover:bg-muted/40 transition-colors">
                <td className="px-4 py-3 font-medium">
                  {u.full_name}
                  {u.id === currentUserId && <span className="text-xs text-muted-foreground mr-2">(אתה)</span>}
                </td>
                <td className="px-4 py-3 text-muted-foreground" dir="ltr">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(new Date(u.created_at))}</td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="outline" onClick={() => openEdit(u)}>ערוך</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards (mobile) */}
      <div className="md:hidden space-y-3">
        {users.map((u) => (
          <div key={u.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">
                  {u.full_name}
                  {u.id === currentUserId && <span className="text-xs text-muted-foreground mr-1">(אתה)</span>}
                </p>
                <p className="text-sm text-muted-foreground" dir="ltr">{u.email}</p>
              </div>
              <Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABELS[u.role]}</Badge>
            </div>
            <Button size="sm" variant="outline" className="w-full" onClick={() => openEdit(u)}>ערוך</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
