import type { ComparisonRowViewModel } from "./types";

/**
 * ComparisonRow Component
 *
 * A reusable row component for the comparison table.
 * Displays a label and corresponding values for both tasting notes.
 * Can render simple text, or complex components like rating displays.
 */
interface ComparisonRowProps {
  row: ComparisonRowViewModel;
}

export function ComparisonRow({ row }: ComparisonRowProps) {
  return (
    <tr className="border-b border-gray-200">
      <td className="py-3 px-4 font-medium text-sm text-gray-700 bg-gray-50">{row.label}</td>
      <td className="py-3 px-4 text-sm text-gray-900">{row.value1 ?? "—"}</td>
      <td className="py-3 px-4 text-sm text-gray-900">{row.value2 ?? "—"}</td>
    </tr>
  );
}
