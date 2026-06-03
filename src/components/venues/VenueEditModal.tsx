"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VenueForm } from "./VenueForm";
import { VenueGallery } from "./VenueGallery";
import type { VenueRow, UserRow } from "@/types/database";

interface VenueEditModalProps {
  venue: VenueRow;
  owners: Pick<UserRow, "id" | "full_name" | "email">[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VenueEditModal({ venue, owners, open, onOpenChange }: VenueEditModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>עריכת אולם — {venue.name}</DialogTitle>
        </DialogHeader>
        <VenueForm venue={venue} owners={owners} onSuccess={() => onOpenChange(false)} />
        <VenueGallery venueId={venue.id} />
      </DialogContent>
    </Dialog>
  );
}
