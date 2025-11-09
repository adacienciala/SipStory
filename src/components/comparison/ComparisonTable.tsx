import { StarRatingDisplay } from "../dashboard/StarRatingDisplay";
import { DotRatingDisplay } from "../tasting-detail/DotRatingDisplay";
import { ComparisonRow } from "./ComparisonRow";
import type { ComparisonRowViewModel, ComparisonViewModel } from "./types";

/**
 * ComparisonTable Component
 *
 * Desktop view that presents two tasting notes in a side-by-side table layout.
 * Each row represents a specific attribute for easy comparison.
 */
interface ComparisonTableProps {
  viewModel: ComparisonViewModel;
}

export function ComparisonTable({ viewModel }: ComparisonTableProps) {
  const { note1, note2 } = viewModel;

  // Build rows for the comparison table
  const rows: ComparisonRowViewModel[] = [
    {
      label: "Brand",
      value1: note1.blend.brand.name,
      value2: note2.blend.brand.name,
      type: "text",
    },
    {
      label: "Blend",
      value1: note1.blend.name,
      value2: note2.blend.name,
      type: "text",
    },
    {
      label: "Region",
      value1: note1.blend.region.name,
      value2: note2.blend.region.name,
      type: "text",
    },
    {
      label: "Overall Rating",
      value1: <StarRatingDisplay rating={note1.overall_rating} />,
      value2: <StarRatingDisplay rating={note2.overall_rating} />,
      type: "star",
    },
    {
      label: "Price per 100g (PLN)",
      value1: note1.price_pln !== null ? `${note1.price_pln} PLN` : null,
      value2: note2.price_pln !== null ? `${note2.price_pln} PLN` : null,
      type: "text",
    },
    {
      label: "Purchase Source",
      value1: note1.purchase_source,
      value2: note2.purchase_source,
      type: "text",
    },
    {
      label: "Umami",
      value1: <DotRatingDisplay label="" value={note1.umami} className="justify-start" />,
      value2: <DotRatingDisplay label="" value={note2.umami} className="justify-start" />,
      type: "dot",
    },
    {
      label: "Bitter",
      value1: <DotRatingDisplay label="" value={note1.bitter} className="justify-start" />,
      value2: <DotRatingDisplay label="" value={note2.bitter} className="justify-start" />,
      type: "dot",
    },
    {
      label: "Sweet",
      value1: <DotRatingDisplay label="" value={note1.sweet} className="justify-start" />,
      value2: <DotRatingDisplay label="" value={note2.sweet} className="justify-start" />,
      type: "dot",
    },
    {
      label: "Foam Quality",
      value1: <DotRatingDisplay label="" value={note1.foam} className="justify-start" />,
      value2: <DotRatingDisplay label="" value={note2.foam} className="justify-start" />,
      type: "dot",
    },
    {
      label: "Notes (Koicha)",
      value1: note1.notes_koicha,
      value2: note2.notes_koicha,
      type: "text",
    },
    {
      label: "Notes (with Milk)",
      value1: note1.notes_milk,
      value2: note2.notes_milk,
      type: "text",
    },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-primary text-primary-foreground">
            <th />
            <th className="py-3 px-4 text-left text-sm font-semibold">{`${note1.blend.brand.name} | ${note1.blend.name}`}</th>
            <th className="py-3 px-4 text-left text-sm font-semibold">{`${note2.blend.brand.name} | ${note2.blend.name}`}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <ComparisonRow key={index} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
