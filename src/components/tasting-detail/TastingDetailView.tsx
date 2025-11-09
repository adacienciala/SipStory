import { BackButton } from "@/components/BackButton";
import { StarRatingDisplay } from "@/components/dashboard/StarRatingDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { DotRatingDisplay } from "./DotRatingDisplay";
import type { TastingDetailViewModel } from "./types";

interface TastingDetailViewProps {
  note: TastingDetailViewModel;
}

/**
 * TastingDetailView Component
 *
 * Main component for displaying a complete tasting note in detail view.
 * Shows all tasting information including ratings, notes, and metadata.
 * Provides options to edit or delete the note.
 */
export function TastingDetailView({ note }: TastingDetailViewProps) {
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleEdit = () => {
    window.location.href = `/tastings/${note.id}/edit`;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      {/* Back to Dashboard */}
      <BackButton text="Back to Dashboard" />

      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            {note.brandName} | {note.blendName}
          </h1>
          <p className="text-sm text-gray-500">Last updated: {note.updatedAt}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="default" onClick={handleEdit} aria-label="Edit tasting note">
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button
            variant="destructive"
            size="default"
            onClick={() => setDeleteDialogOpen(true)}
            aria-label="Delete tasting note"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>

      {/* Main Details Section */}
      <Card>
        <CardHeader>
          <CardTitle>Ratings & Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Rating */}
          <div className="flex items-center justify-between border-b pb-4">
            <span className="text-sm font-medium text-gray-700">Overall Rating</span>
            <StarRatingDisplay rating={note.overallRating} />
          </div>

          {/* Structured Ratings */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Tasting Characteristics</h3>
            <DotRatingDisplay label="Umami" value={note.umami} />
            <DotRatingDisplay label="Bitter" value={note.bitter} />
            <DotRatingDisplay label="Sweet" value={note.sweet} />
            <DotRatingDisplay label="Foam Quality" value={note.foam} />
          </div>

          {/* General Info */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900">General Information</h3>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Region</span>
              <span className="text-sm text-gray-900">{note.regionName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Price (per 100g)</span>
              <span className="text-sm text-gray-900">{note.pricePln || "—"}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Purchase Source</span>
              {note.purchaseSource.isUrl ? (
                <a
                  href={note.purchaseSource.text}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {note.purchaseSource.text}
                </a>
              ) : (
                <span className="text-sm text-gray-900">{note.purchaseSource.text || "—"}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      {(note.notesKoicha || note.notesMilk) && (
        <Card>
          <CardHeader>
            <CardTitle>Tasting Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {note.notesKoicha && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Notes as Koicha</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.notesKoicha}</p>
              </div>
            )}

            {note.notesMilk && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Notes with Milk</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.notesMilk}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog isOpen={isDeleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} noteId={note.id} />
    </div>
  );
}
