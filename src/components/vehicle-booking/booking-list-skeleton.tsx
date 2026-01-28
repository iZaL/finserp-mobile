interface BookingListSkeletonProps {
  count?: number;
}

export function BookingListSkeleton({count = 3}: BookingListSkeletonProps) {
  return (
    <>
      {Array.from({length: count}, (_, i) => (
        <div
          key={i}
          className="bg-card text-card-foreground rounded-xl border p-4 shadow-sm"
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-muted size-10 animate-pulse rounded-lg" />
              <div className="space-y-2">
                <div className="bg-muted h-4 w-32 animate-pulse rounded" />
                <div className="bg-muted h-3 w-16 animate-pulse rounded" />
              </div>
            </div>
            <div className="bg-muted h-6 w-16 animate-pulse rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="bg-muted h-3 w-full animate-pulse rounded" />
            <div className="bg-muted h-3 w-3/4 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </>
  );
}
