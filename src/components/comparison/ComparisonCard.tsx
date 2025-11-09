import type { TastingNoteResponseDTO } from "../../types";
import { StarRatingDisplay } from "../dashboard/StarRatingDisplay";
import { DotRatingDisplay } from "../tasting-detail/DotRatingDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

/**
 * ComparisonCard Component
 *
 * Mobile view card that displays all information for a single tasting note.
 * Two cards will be rendered vertically for side-by-side comparison.
 */
interface ComparisonCardProps {
  note: TastingNoteResponseDTO;
}

export function ComparisonCard({ note }: ComparisonCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{`${note.blend.brand.name} | ${note.blend.name}`}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-sm font-medium text-gray-700">Brand</dt>
            <dd className="text-sm text-gray-900">{note.blend.brand.name}</dd>
          </div>

          <div className="flex justify-between">
            <dt className="text-sm font-medium text-gray-700">Region</dt>
            <dd className="text-sm text-gray-900">{note.blend.region.name}</dd>
          </div>

          <div className="flex justify-between items-center">
            <dt className="text-sm font-medium text-gray-700">Overall Rating</dt>
            <dd>
              <StarRatingDisplay rating={note.overall_rating} />
            </dd>
          </div>

          <div className="border-t pt-3">
            <DotRatingDisplay label="Umami" value={note.umami} />
          </div>

          <div>
            <DotRatingDisplay label="Bitter" value={note.bitter} />
          </div>

          <div>
            <DotRatingDisplay label="Sweet" value={note.sweet} />
          </div>

          <div>
            <DotRatingDisplay label="Foam Quality" value={note.foam} />
          </div>

          {note.notes_koicha && (
            <div className="border-t pt-3">
              <dt className="text-sm font-medium text-gray-700 mb-1">Notes (Koicha)</dt>
              <dd className="text-sm text-gray-900">{note.notes_koicha}</dd>
            </div>
          )}

          {note.notes_milk && (
            <div className={note.notes_koicha ? "" : "border-t pt-3"}>
              <dt className="text-sm font-medium text-gray-700 mb-1">Notes (with Milk)</dt>
              <dd className="text-sm text-gray-900">{note.notes_milk}</dd>
            </div>
          )}

          {note.price_pln !== null && (
            <div className="border-t pt-3 flex justify-between">
              <dt className="text-sm font-medium text-gray-700">Price per 100g</dt>
              <dd className="text-sm text-gray-900">{note.price_pln} PLN</dd>
            </div>
          )}

          {note.purchase_source && (
            <div className={note.price_pln !== null ? "flex justify-between" : "border-t pt-3 flex justify-between"}>
              <dt className="text-sm font-medium text-gray-700">Purchase Source</dt>
              <dd className="text-sm text-gray-900 truncate ml-2">{note.purchase_source}</dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
