"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import type { LeadStatus } from "@/types/database";
import { useRouter } from "next/navigation";

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "חדש",
  considering: "שוקל/ת",
  waiting_for_date: "ממתין/ה לתאריך",
  date_taken: "תאריך תפוס",
  booked: "הוזמן",
  cancelled: "בוטל",
};

const STATUS_VARIANT: Record<LeadStatus, "default" | "secondary" | "outline" | "destructive"> = {
  new: "default",
  considering: "secondary",
  waiting_for_date: "secondary",
  date_taken: "outline",
  booked: "default",
  cancelled: "destructive",
};

type VenueRef = { id: string; name: string };
type Interest = { venue: VenueRef | null };
type LeadRow = {
  id: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  status: LeadStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  interests: Interest[];
};

interface LeadsManagerProps {
  leads: LeadRow[];
  venues: VenueRef[];
}

const EMPTY_FORM = { client_name: "", client_phone: "", client_email: "", notes: "", status: "new" as LeadStatus };

export function LeadsManager({ leads: initialLeads, venues }: LeadsManagerProps) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);

  const filtered = leads.filter((l) => {
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      l.client_name.toLowerCase().includes(q) ||
      l.client_phone.includes(q) ||
      (l.client_email ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  function setF(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("leads") as any)
      .insert({
        client_name: form.client_name,
        client_phone: form.client_phone,
        client_email: form.client_email || null,
        notes: form.notes || null,
        status: form.status,
      })
      .select("*, interests:lead_venue_interests(venue:venues(id,name))")
      .single();

    setSaving(false);
    if (error) { toast.error("שגיאה בשמירת ליד"); return; }
    setLeads((prev) => [data, ...prev]);
    setForm(EMPTY_FORM);
    setAddOpen(false);
    toast.success("הליד נוסף");
    router.refresh();
  }

  async function updateLeadStatus(leadId: string, newStatus: LeadStatus) {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("leads") as any)
      .update({ status: newStatus })
      .eq("id", leadId);
    if (error) { toast.error("שגיאה בעדכון"); return; }
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: newStatus } : l));
    if (selectedLead?.id === leadId) setSelectedLead((l) => l ? { ...l, status: newStatus } : l);
    toast.success("הסטטוס עודכן");
  }

  async function updateNotes(leadId: string, notes: string) {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("leads") as any)
      .update({ notes })
      .eq("id", leadId);
    if (error) { toast.error("שגיאה בשמירת הערות"); return; }
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, notes } : l));
    if (selectedLead?.id === leadId) setSelectedLead((l) => l ? { ...l, notes } : l);
    toast.success("ההערות נשמרו");
  }

  async function addVenueInterest(leadId: string, venueId: string) {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("lead_venue_interests") as any)
      .insert({ lead_id: leadId, venue_id: venueId });
    if (error) { toast.error("שגיאה בהוספת אולם"); return; }
    const venue = venues.find((v) => v.id === venueId);
    if (!venue) return;
    const newInterest: Interest = { venue };
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, interests: [...l.interests, newInterest] } : l));
    if (selectedLead?.id === leadId) setSelectedLead((l) => l ? { ...l, interests: [...l.interests, newInterest] } : l);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="חיפוש לפי שם, טלפון, מייל..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as LeadStatus | "all")}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="כל הסטטוסים" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            {(Object.entries(STATUS_LABELS) as [LeadStatus, string][]).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0">+ ליד חדש</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>הוספת ליד חדש</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label>שם לקוח *</Label>
                <Input value={form.client_name} onChange={(e) => setF("client_name", e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>טלפון *</Label>
                <Input type="tel" dir="ltr" value={form.client_phone} onChange={(e) => setF("client_phone", e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>מייל</Label>
                <Input type="email" dir="ltr" value={form.client_email} onChange={(e) => setF("client_email", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>סטטוס</Label>
                <Select value={form.status} onValueChange={(v) => setF("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(STATUS_LABELS) as [LeadStatus, string][]).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>הערות</Label>
                <Textarea rows={3} value={form.notes} onChange={(e) => setF("notes", e.target.value)} />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={saving} className="flex-1">{saving ? "שומר..." : "שמור"}</Button>
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>ביטול</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} לידים</p>

      {/* Lead cards */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center py-10 text-muted-foreground">אין לידים תואמים</p>
        )}
        {filtered.map((lead) => (
          <div key={lead.id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="font-semibold">{lead.client_name}</p>
                <p className="text-sm text-muted-foreground" dir="ltr">{lead.client_phone}</p>
                {lead.client_email && <p className="text-xs text-muted-foreground" dir="ltr">{lead.client_email}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={STATUS_VARIANT[lead.status]}>{STATUS_LABELS[lead.status]}</Badge>
                <span className="text-xs text-muted-foreground">{formatDate(new Date(lead.created_at))}</span>
              </div>
            </div>

            {/* Venue interests */}
            {lead.interests.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {lead.interests.map((int, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{int.venue?.name ?? "—"}</Badge>
                ))}
              </div>
            )}

            {lead.notes && (
              <p className="text-sm text-muted-foreground bg-muted rounded p-2 mb-3">{lead.notes}</p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" onClick={() => setSelectedLead(lead)}>ערוך</Button>
                </DialogTrigger>
                {selectedLead?.id === lead.id && (
                  <LeadDetailDialog
                    lead={selectedLead}
                    venues={venues}
                    onStatusChange={updateLeadStatus}
                    onNotesChange={updateNotes}
                    onAddVenue={addVenueInterest}
                  />
                )}
              </Dialog>
              <Select value={lead.status} onValueChange={(v) => updateLeadStatus(lead.id, v as LeadStatus)}>
                <SelectTrigger className="h-8 text-xs w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(STATUS_LABELS) as [LeadStatus, string][]).map(([v, l]) => (
                    <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeadDetailDialog({
  lead, venues, onStatusChange, onNotesChange, onAddVenue,
}: {
  lead: LeadRow;
  venues: VenueRef[];
  onStatusChange: (id: string, s: LeadStatus) => void;
  onNotesChange: (id: string, n: string) => void;
  onAddVenue: (id: string, venueId: string) => void;
}) {
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [addingVenue, setAddingVenue] = useState("");

  const existingVenueIds = new Set(lead.interests.map((i) => i.venue?.id).filter(Boolean));
  const availableVenues = venues.filter((v) => !existingVenueIds.has(v.id));

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{lead.client_name}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 mt-2">
        <div className="space-y-1">
          <Label>סטטוס</Label>
          <Select value={lead.status} onValueChange={(v) => onStatusChange(lead.id, v as LeadStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.entries(STATUS_LABELS) as [LeadStatus, string][]).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>אולמות מעניינים</Label>
          <div className="flex flex-wrap gap-1 min-h-6">
            {lead.interests.length === 0 && <span className="text-xs text-muted-foreground">אין</span>}
            {lead.interests.map((int, i) => (
              <Badge key={i} variant="outline" className="text-xs">{int.venue?.name ?? "—"}</Badge>
            ))}
          </div>
          {availableVenues.length > 0 && (
            <div className="flex gap-2 mt-2">
              <Select value={addingVenue} onValueChange={setAddingVenue}>
                <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue placeholder="הוסף אולם..." /></SelectTrigger>
                <SelectContent>
                  {availableVenues.map((v) => (
                    <SelectItem key={v.id} value={v.id} className="text-xs">{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" disabled={!addingVenue} onClick={() => { if (addingVenue) { onAddVenue(lead.id, addingVenue); setAddingVenue(""); } }}>
                הוסף
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <Label>הערות</Label>
          <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button size="sm" className="mt-1" onClick={() => onNotesChange(lead.id, notes)}>שמור הערות</Button>
        </div>
      </div>
    </DialogContent>
  );
}
