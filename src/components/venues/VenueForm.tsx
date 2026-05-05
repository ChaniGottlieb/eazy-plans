"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VenueRow, UserRow } from "@/types/database";

interface VenueFormProps {
  venue?: VenueRow;
  owners: Pick<UserRow, "id" | "full_name" | "email">[];
}

export function VenueForm({ venue, owners }: VenueFormProps) {
  const router = useRouter();
  const isEdit = !!venue;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: venue?.name ?? "",
    address: venue?.address ?? "",
    city: venue?.city ?? "",
    neighborhood: venue?.neighborhood ?? "",
    max_capacity: venue?.max_capacity?.toString() ?? "",
    owner_user_id: venue?.owner_user_id ?? "",
    description_short: venue?.description_short ?? "",
    description_long: venue?.description_long ?? "",
    parking_info: venue?.parking_info ?? "",
    public_transport_info: venue?.public_transport_info ?? "",
    price_morning: venue?.price_morning?.toString() ?? "",
    price_evening: venue?.price_evening?.toString() ?? "",
    price_full_day: venue?.price_full_day?.toString() ?? "",
    price_shabbat: venue?.price_shabbat?.toString() ?? "",
    hours_morning_start: venue?.hours_morning_start ?? "",
    hours_morning_end: venue?.hours_morning_end ?? "",
    hours_evening_start: venue?.hours_evening_start ?? "18:00",
    hours_evening_end: venue?.hours_evening_end ?? "00:00",
    hours_full_start: venue?.hours_full_start ?? "",
    hours_full_end: venue?.hours_full_end ?? "",
    hours_shabbat_start: venue?.hours_shabbat_start ?? "",
    hours_shabbat_end: venue?.hours_shabbat_end ?? "",
    is_active: venue?.is_active ?? true,
  });

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.owner_user_id) {
      toast.error("יש לבחור בעל אולם");
      return;
    }
    setLoading(true);

    const payload = {
      name: form.name,
      address: form.address,
      city: form.city,
      neighborhood: form.neighborhood || null,
      max_capacity: parseInt(form.max_capacity),
      owner_user_id: form.owner_user_id,
      description_short: form.description_short || null,
      description_long: form.description_long || null,
      parking_info: form.parking_info || null,
      public_transport_info: form.public_transport_info || null,
      price_morning: form.price_morning ? parseFloat(form.price_morning) : null,
      price_evening: form.price_evening ? parseFloat(form.price_evening) : null,
      price_full_day: form.price_full_day ? parseFloat(form.price_full_day) : null,
      price_shabbat: form.price_shabbat ? parseFloat(form.price_shabbat) : null,
      hours_morning_start: form.hours_morning_start || null,
      hours_morning_end: form.hours_morning_end || null,
      hours_evening_start: form.hours_evening_start || null,
      hours_evening_end: form.hours_evening_end || null,
      hours_full_start: form.hours_full_start || null,
      hours_full_end: form.hours_full_end || null,
      hours_shabbat_start: form.hours_shabbat_start || null,
      hours_shabbat_end: form.hours_shabbat_end || null,
      is_active: form.is_active,
    };

    const supabase = createClient();
    let error;

    if (isEdit) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ({ error } = await (supabase.from("venues") as any).update(payload).eq("id", venue.id));
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ({ error } = await (supabase.from("venues") as any).insert(payload));
    }

    setLoading(false);

    if (error) {
      toast.error("שגיאה בשמירת האולם: " + error.message);
      return;
    }

    toast.success(isEdit ? "האולם עודכן בהצלחה" : "האולם נוסף בהצלחה");
    router.push("/venues");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {/* Basic info */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">פרטים כלליים</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1 col-span-2">
            <Label htmlFor="name">שם האולם *</Label>
            <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div className="space-y-1 col-span-2">
            <Label htmlFor="address">כתובת *</Label>
            <Input id="address" value={form.address} onChange={(e) => set("address", e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="city">עיר *</Label>
            <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="neighborhood">שכונה</Label>
            <Input id="neighborhood" value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="max_capacity">קיבולת מקסימלית *</Label>
            <Input id="max_capacity" type="number" min="1" value={form.max_capacity} onChange={(e) => set("max_capacity", e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>בעל האולם *</Label>
            <Select value={form.owner_user_id} onValueChange={(v) => set("owner_user_id", v)}>
              <SelectTrigger>
                <SelectValue placeholder="בחר בעל אולם" />
              </SelectTrigger>
              <SelectContent>
                {owners.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.full_name} ({o.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="description_short">תיאור קצר</Label>
          <Input id="description_short" value={form.description_short} onChange={(e) => set("description_short", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="description_long">תיאור מפורט</Label>
          <Textarea id="description_long" rows={4} value={form.description_long} onChange={(e) => set("description_long", e.target.value)} />
        </div>
      </section>

      {/* Pricing */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">מחירון (₪)</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: "price_morning", label: "בוקר" },
            { key: "price_evening", label: "ערב" },
            { key: "price_full_day", label: "יום מלא" },
            { key: "price_shabbat", label: "שבת" },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                type="number"
                min="0"
                step="100"
                placeholder="0"
                value={(form as unknown as Record<string, string>)[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Hours */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">שעות</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { startKey: "hours_morning_start", endKey: "hours_morning_end", label: "בוקר" },
            { startKey: "hours_evening_start", endKey: "hours_evening_end", label: "ערב" },
            { startKey: "hours_full_start", endKey: "hours_full_end", label: "יום מלא" },
            { startKey: "hours_shabbat_start", endKey: "hours_shabbat_end", label: "שבת" },
          ].map(({ startKey, endKey, label }) => (
            <div key={startKey} className="space-y-1">
              <Label>{label}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={(form as unknown as Record<string, string>)[startKey]}
                  onChange={(e) => set(startKey, e.target.value)}
                  className="w-full"
                  dir="ltr"
                />
                <span className="text-muted-foreground">—</span>
                <Input
                  type="time"
                  value={(form as unknown as Record<string, string>)[endKey]}
                  onChange={(e) => set(endKey, e.target.value)}
                  className="w-full"
                  dir="ltr"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Access */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">פרטי גישה</h2>
        <div className="space-y-1">
          <Label htmlFor="parking_info">חנייה</Label>
          <Textarea id="parking_info" rows={2} value={form.parking_info} onChange={(e) => set("parking_info", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="public_transport_info">תחבורה ציבורית</Label>
          <Textarea id="public_transport_info" rows={2} value={form.public_transport_info} onChange={(e) => set("public_transport_info", e.target.value)} />
        </div>
      </section>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "שומר..." : isEdit ? "עדכן אולם" : "הוסף אולם"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          ביטול
        </Button>
      </div>
    </form>
  );
}
