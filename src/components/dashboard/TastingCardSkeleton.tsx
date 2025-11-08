import { Card, CardContent, CardHeader } from "../ui/card";

/**
 * TastingCardSkeleton Component
 *
 * A skeleton loader that mimics the layout of a TastingCard
 * to provide visual feedback while data is being fetched.
 */
export function TastingCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
      </CardContent>
    </Card>
  );
}
