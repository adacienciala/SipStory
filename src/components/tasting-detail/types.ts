/**
 * View Model for displaying a tasting note in detail view
 * Derived from TastingNoteResponseDTO with formatted and display-friendly data
 */
export interface TastingDetailViewModel {
  id: string;
  blendName: string;
  brandName: string;
  regionName: string;
  overallRating: number;
  umami: number | null;
  bitter: number | null;
  sweet: number | null;
  foam: number | null;
  notesKoicha: string | null;
  notesMilk: string | null;
  pricePln: string | null; // Formatted as "123 PLN" or "—"
  purchaseSource: {
    text: string;
    isUrl: boolean;
  };
  updatedAt: string; // Formatted as "Month Day, Year"
}
