"use client";

import { he } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { EventType } from "@/types/database";
import { EVENT_TYPE_LABELS } from "@/types/booking";

const TYPE_COLORS: Record<EventType, string> = {
  morning: "border-blue-400 data-[selected=true]:bg-blue-500 data-[selected=true]:text-white",
  evening: "border-purple-400 data-[selected=true]:bg-purple-500 data-[selected=true]:text-white",
  full_day: "border-green-400 data-[selected=true]:bg-green-500 data-[selected=true]:text-white",
  shabbat: "border-orange-400 data-[selected=true]:bg-orange-500 data-[selected=true]:text-white",
};

interface Step1Props {
  date: Date | null;
  eventType: EventType | null;
  onChange: (date: Date | null, eventType: EventType | null) => void;
  onNext: () => void;
}

export function Step1DateType({ date, eventType, onChange, onNext }: Step1Props) {
  const canContinue = !!date && !!eventType;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-start">
        {/* Calendar */}
        <div className="w-[60%] shrink-0">
          <Label className="text-base font-semibold">בחר תאריך</Label>
          <Calendar
            mode="single"
            selected={date ?? undefined}
            onSelect={(d) => onChange(d ?? null, eventType)}
            locale={he}
            weekStartsOn={0}
            disabled={{ before: new Date() }}
            className="border rounded-lg p-3 w-full mt-2"
          />
        </div>

        {/* Event type */}
        <div className="w-[40%] shrink-0">
          <Label className="text-base font-semibold">סוג האירוע</Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {(Object.entries(EVENT_TYPE_LABELS) as [EventType, string][]).map(([type, label]) => (
              <button
                key={type}
                type="button"
                data-selected={eventType === type}
                onClick={() => onChange(date, type)}
                className={`border-2 rounded-lg py-6 px-3 text-base font-medium transition-all ${TYPE_COLORS[type]} hover:opacity-80`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button onClick={onNext} disabled={!canContinue} className="w-full">
        המשך לסינון אולמות
      </Button>
    </div>
  );
}
