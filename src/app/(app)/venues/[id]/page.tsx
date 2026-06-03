import { notFound, redirect } from "next/navigation";
import { getUserProfile } from "@/lib/supabase/queries";
import { VenueForm } from "@/components/venues/VenueForm";
import { VenueGallery } from "@/components/venues/VenueGallery";
import type { VenueRow, UserRow } from "@/types/database";

export default async function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile } = await getUserProfile();
  if (profile.role !== "admin") redirect("/venues");

  const [{ data: venue }, { data: owners }] = await Promise.all([
    supabase.from("venues").select("*").eq("id", id).single() as unknown as Promise<{ data: VenueRow | null }>,
    supabase.from("users").select("id, full_name, email").eq("role", "venue_owner").order("full_name") as unknown as Promise<{ data: Pick<UserRow, "id" | "full_name" | "email">[] | null }>,
  ]);

  if (!venue) notFound();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{venue.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">{venue.city}{venue.neighborhood ? ` · ${venue.neighborhood}` : ""}</p>
      </div>
      <VenueForm venue={venue} owners={owners ?? []} />
      <VenueGallery venueId={venue.id} />
    </div>
  );
}
