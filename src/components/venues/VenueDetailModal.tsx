"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { VenueRow } from "@/types/database";

interface VenueDetailModalProps {
  venue: VenueRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

function HoursRow({ label, start, end }: { label: string; start?: string | null; end?: string | null }) {
  if (!start && !end) return null;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span dir="ltr">{start ?? "—"} – {end ?? "—"}</span>
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value?: number | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{formatCurrency(value)}</span>
    </div>
  );
}

export function VenueDetailModal({ venue, open, onOpenChange }: VenueDetailModalProps) {
  const hasPrices = venue.price_morning || venue.price_evening || venue.price_full_day || venue.price_shabbat;
  const hasHours =
    venue.hours_morning_start || venue.hours_evening_start ||
    venue.hours_full_start || venue.hours_shabbat_start;
  const hasAccess = venue.parking_info || venue.public_transport_info;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {venue.name}
            <Badge variant={venue.is_active ? "default" : "secondary"} className="text-xs">
              {venue.is_active ? "פעיל" : "לא פעיל"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-1">
          {/* Location */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold border-b pb-1">מיקום</h3>
            <Field label="כתובת" value={venue.address} />
            <div className="flex gap-6">
              <Field label="עיר" value={venue.city} />
              {venue.neighborhood && <Field label="שכונה" value={venue.neighborhood} />}
            </div>
            <Field label="קיבולת מקסימלית" value={`${venue.max_capacity} אורחים`} />
          </section>

          {/* Description */}
          {(venue.description_short || venue.description_long) && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold border-b pb-1">תיאור</h3>
              <Field label="תיאור קצר" value={venue.description_short} />
              <Field label="תיאור מפורט" value={venue.description_long} />
            </section>
          )}

          {/* Prices */}
          {hasPrices && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold border-b pb-1">מחירון</h3>
              <PriceRow label="בוקר" value={venue.price_morning} />
              <PriceRow label="ערב" value={venue.price_evening} />
              <PriceRow label="יום מלא" value={venue.price_full_day} />
              <PriceRow label="שבת" value={venue.price_shabbat} />
            </section>
          )}

          {/* Hours */}
          {hasHours && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold border-b pb-1">שעות</h3>
              <HoursRow label="בוקר" start={venue.hours_morning_start} end={venue.hours_morning_end} />
              <HoursRow label="ערב" start={venue.hours_evening_start} end={venue.hours_evening_end} />
              <HoursRow label="יום מלא" start={venue.hours_full_start} end={venue.hours_full_end} />
              <HoursRow label="שבת" start={venue.hours_shabbat_start} end={venue.hours_shabbat_end} />
            </section>
          )}

          {/* Access */}
          {hasAccess && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold border-b pb-1">גישה</h3>
              <Field label="חנייה" value={venue.parking_info} />
              <Field label="תחבורה ציבורית" value={venue.public_transport_info} />
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
