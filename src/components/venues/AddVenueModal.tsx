"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VenueForm } from "./VenueForm";
import { VenueGallery } from "./VenueGallery";
import type { UserRow } from "@/types/database";

interface AddVenueModalProps {
  owners: Pick<UserRow, "id" | "full_name" | "email">[];
}

export function AddVenueModal({ owners }: AddVenueModalProps) {
  const [open, setOpen] = useState(false);
  const [createdVenueId, setCreatedVenueId] = useState<string | null>(null);

  function handleOpen() {
    setCreatedVenueId(null);
    setOpen(true);
  }

  function handleClose() {
    setCreatedVenueId(null);
    setOpen(false);
  }

  function handleVenueCreated(venueId?: string) {
    if (venueId) {
      setCreatedVenueId(venueId);
    } else {
      handleClose();
    }
  }

  return (
    <>
      <Button onClick={handleOpen}>
        <Plus size={16} className="ml-2" />
        אולם חדש
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {createdVenueId ? "תמונות לאולם" : "הוספת אולם חדש"}
            </DialogTitle>
          </DialogHeader>

          {createdVenueId ? (
            <div className="space-y-4">
              <VenueGallery venueId={createdVenueId} />
              <Button onClick={handleClose} className="w-full">סיום</Button>
            </div>
          ) : (
            <VenueForm owners={owners} onSuccess={handleVenueCreated} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
