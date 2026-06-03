"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { VenueDetailModal } from "./VenueDetailModal";
import { VenueEditModal } from "./VenueEditModal";
import type { VenueRow, UserRow } from "@/types/database";

interface VenuesTableProps {
  venues: VenueRow[];
  owners: Pick<UserRow, "id" | "full_name" | "email">[];
  isAdmin?: boolean;
}

export function VenuesTable({ venues, owners, isAdmin = false }: VenuesTableProps) {
  const [detailVenue, setDetailVenue] = useState<VenueRow | null>(null);
  const [editVenue, setEditVenue] = useState<VenueRow | null>(null);

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם האולם</TableHead>
              <TableHead>עיר</TableHead>
              <TableHead>קיבולת</TableHead>
              <TableHead>מחיר ערב</TableHead>
              <TableHead>סטטוס</TableHead>
              {isAdmin && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {venues.map((venue) => (
              <TableRow
                key={venue.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setDetailVenue(venue)}
              >
                <TableCell className="font-medium">{venue.name}</TableCell>
                <TableCell>{venue.city}{venue.neighborhood ? ` · ${venue.neighborhood}` : ""}</TableCell>
                <TableCell>{venue.max_capacity} אורחים</TableCell>
                <TableCell>
                  {venue.price_evening ? formatCurrency(Number(venue.price_evening)) : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={venue.is_active ? "default" : "secondary"}>
                    {venue.is_active ? "פעיל" : "לא פעיל"}
                  </Badge>
                </TableCell>
                {isAdmin && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditVenue(venue)}
                    >
                      עריכה
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {detailVenue && (
        <VenueDetailModal
          venue={detailVenue}
          open
          onOpenChange={(open) => { if (!open) setDetailVenue(null); }}
        />
      )}

      {editVenue && (
        <VenueEditModal
          venue={editVenue}
          owners={owners}
          open
          onOpenChange={(open) => { if (!open) setEditVenue(null); }}
        />
      )}
    </>
  );
}
