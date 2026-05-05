"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import type { VenueImageRow } from "@/types/database";

const BUCKET = "venue-images";

interface VenueGalleryProps {
  venueId: string;
}

export function VenueGallery({ venueId }: VenueGalleryProps) {
  const [images, setImages] = useState<VenueImageRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function load() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from("venue_images") as any)
      .select("*")
      .eq("venue_id", venueId)
      .order("created_at");
    setImages(data ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueId]);

  function getUrl(path: string) {
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);

    // Only the very first image in the first-ever upload becomes primary
    let needPrimary = images.length === 0;

    for (const file of files) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${venueId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file);

      if (uploadError) {
        toast.error("שגיאה בהעלאת תמונה: " + uploadError.message);
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: dbError } = await (supabase.from("venue_images") as any).insert({
        venue_id: venueId,
        storage_path: path,
        is_primary: needPrimary,
      });

      if (dbError) {
        toast.error("שגיאה בשמירת התמונה: " + dbError.message);
      } else {
        needPrimary = false;
      }
    }

    setUploading(false);
    e.target.value = "";
    toast.success("התמונות הועלו בהצלחה");
    await load();
  }

  async function handleDelete(img: VenueImageRow) {
    await supabase.storage.from(BUCKET).remove([img.storage_path]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("venue_images") as any).delete().eq("id", img.id);

    // If we deleted the primary, promote the first remaining image
    if (img.is_primary) {
      const remaining = images.filter((i) => i.id !== img.id);
      if (remaining.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("venue_images") as any)
          .update({ is_primary: true })
          .eq("id", remaining[0].id);
      }
    }

    toast.success("התמונה נמחקה");
    await load();
  }

  async function handleSetPrimary(img: VenueImageRow) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("venue_images") as any)
      .update({ is_primary: false })
      .eq("venue_id", venueId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("venue_images") as any)
      .update({ is_primary: true })
      .eq("id", img.id);
    await load();
  }

  return (
    <section className="space-y-4 max-w-2xl">
      <h2 className="text-lg font-semibold border-b pb-2">גלריית תמונות</h2>

      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">אין תמונות עדיין</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative group rounded-lg overflow-hidden border bg-muted"
            >
              <div className="aspect-video relative">
                <Image
                  src={getUrl(img.storage_path)}
                  alt="venue"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              {img.is_primary && (
                <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-sm">
                  ראשי
                </span>
              )}

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                {!img.is_primary && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full text-xs"
                    onClick={() => handleSetPrimary(img)}
                  >
                    הגדר כראשי
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full text-xs"
                  onClick={() => handleDelete(img)}
                >
                  מחק
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? "מעלה תמונות..." : "הוסף תמונות"}
        </Button>
      </div>
    </section>
  );
}
