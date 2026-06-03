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
  onSuccess?: (venueId?: string) => void;
}

export function VenueForm({ venue, owners, onSuccess }: VenueFormProps) {
  const router = useRouter();
  const isEdit = !!venue;

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    setErrors((e) => { const next = { ...e }; delete next[field]; return next; });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!form.name.trim()) errs.name = "שם האולם הוא שדה חובה";
    else if (form.name.trim().length < 2) errs.name = "שם האולם חייב להכיל לפחות 2 תווים";

    if (!form.address.trim()) errs.address = "כתובת היא שדה חובה";

    if (!form.city.trim()) errs.city = "עיר היא שדה חובה";

    if (!form.max_capacity) errs.max_capacity = "קיבולת מקסימלית היא שדה חובה";
    else if (isNaN(parseInt(form.max_capacity)) || parseInt(form.max_capacity) < 1)
      errs.max_capacity = "קיבולת חייבת להיות מספר חיובי";

    if (!form.owner_user_id) errs.owner_user_id = "יש לבחור בעל אולם";

    for (const key of ["price_morning", "price_evening", "price_full_day", "price_shabbat"]) {
      const val = (form as unknown as Record<string, string>)[key];
      if (val !== "" && (isNaN(parseFloat(val)) || parseFloat(val) < 0))
        errs[key] = "המחיר חייב להיות מספר אי-שלילי";
    }

    const hourPairs = [
      ["hours_morning_start", "hours_morning_end"],
      ["hours_evening_start", "hours_evening_end"],
      ["hours_full_start", "hours_full_end"],
      ["hours_shabbat_start", "hours_shabbat_end"],
    ];
    for (const [startKey, endKey] of hourPairs) {
      const s = (form as unknown as Record<string, string>)[startKey];
      const e = (form as unknown as Record<string, string>)[endKey];
      if (s && !e) errs[endKey] = "יש למלא שעת סיום";
      if (!s && e) errs[startKey] = "יש למלא שעת התחלה";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
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

    let newVenueId: string | undefined;

    if (isEdit) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ({ error } = await (supabase.from("venues") as any).update(payload).eq("id", venue.id));
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: inserted, error: insertError } = await (supabase.from("venues") as any)
        .insert(payload)
        .select("id")
        .single();
      error = insertError;
      newVenueId = inserted?.id;
    }

    setLoading(false);

    if (error) {
      toast.error("שגיאה בשמירת האולם: " + error.message);
      return;
    }

    toast.success(isEdit ? "האולם עודכן בהצלחה" : "האולם נוסף בהצלחה");
    if (onSuccess) {
      onSuccess(newVenueId);
      router.refresh();
    } else {
      router.push("/venues");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {/* Basic info */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">פרטים כלליים</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1 col-span-2">
            <Label htmlFor="name">שם האולם *</Label>
            <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} className={errors.name ? "border-destructive" : ""} />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-1 col-span-2">
            <Label htmlFor="address">כתובת *</Label>
            <Input id="address" value={form.address} onChange={(e) => set("address", e.target.value)} className={errors.address ? "border-destructive" : ""} />
            {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="city">עיר *</Label>
            <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} className={errors.city ? "border-destructive" : ""} />
            {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="neighborhood">שכונה</Label>
            <Input id="neighborhood" value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="max_capacity">קיבולת מקסימלית *</Label>
            <Input id="max_capacity" type="number" min="1" value={form.max_capacity} onChange={(e) => set("max_capacity", e.target.value)} className={errors.max_capacity ? "border-destructive" : ""} />
            {errors.max_capacity && <p className="text-xs text-destructive">{errors.max_capacity}</p>}
          </div>
          <div className="space-y-1">
            <Label>בעל האולם *</Label>
            <Select value={form.owner_user_id} onValueChange={(v) => set("owner_user_id", v)}>
              <SelectTrigger dir="rtl" className={errors.owner_user_id ? "border-destructive" : ""}>
                <SelectValue placeholder="בחר בעל אולם" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {owners.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.full_name} ({o.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.owner_user_id && <p className="text-xs text-destructive">{errors.owner_user_id}</p>}
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
                className={errors[key] ? "border-destructive" : ""}
              />
              {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
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
                  className={`w-full${errors[startKey] ? " border-destructive" : ""}`}
                  dir="ltr"
                />
                <span className="text-muted-foreground">—</span>
                <Input
                  type="time"
                  value={(form as unknown as Record<string, string>)[endKey]}
                  onChange={(e) => set(endKey, e.target.value)}
                  className={`w-full${errors[endKey] ? " border-destructive" : ""}`}
                  dir="ltr"
                />
              </div>
              {errors[startKey] && <p className="text-xs text-destructive">{errors[startKey]}</p>}
              {errors[endKey] && <p className="text-xs text-destructive">{errors[endKey]}</p>}
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
        <Button type="button" variant="outline" onClick={() => onSuccess ? onSuccess() : router.back()}>
          ביטול
        </Button>
      </div>
    </form>
  );
}
