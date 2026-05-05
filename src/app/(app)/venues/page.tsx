import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { VenueRow } from "@/types/database";

export default async function VenuesPage() {
  const supabase = await createClient();

  const { data: venues } = await supabase
    .from("venues")
    .select("*")
    .order("created_at", { ascending: false }) as { data: VenueRow[] | null };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">אולמות</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {venues?.length ?? 0} אולמות במערכת
          </p>
        </div>
        <Button asChild>
          <Link href="/venues/new">
            <Plus size={16} className="ml-2" />
            אולם חדש
          </Link>
        </Button>
      </div>

      {!venues?.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground gap-3">
          <Building2 size={48} strokeWidth={1} />
          <p className="text-lg font-medium">אין אולמות עדיין</p>
          <p className="text-sm">הוסף את האולם הראשון שלך</p>
          <Button asChild className="mt-2">
            <Link href="/venues/new">הוסף אולם</Link>
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם האולם</TableHead>
                <TableHead>עיר</TableHead>
                <TableHead>קיבולת</TableHead>
                <TableHead>מחיר ערב</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {venues.map((venue) => (
                <TableRow key={venue.id} className="cursor-pointer hover:bg-muted/50">
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
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/venues/${venue.id}`}>פרטים</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
