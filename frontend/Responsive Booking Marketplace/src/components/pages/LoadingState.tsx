import { Skeleton } from '../ui/skeleton';

export function LoadingBusinessCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-soft">
      <div className="md:flex">
        <Skeleton className="md:w-64 h-48 md:h-48" />
        <div className="p-6 flex-1">
          <Skeleton className="h-6 w-48 mb-3" />
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-4" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoadingBusinessProfile() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <div className="bg-white shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-96 mb-6" />
          <div className="flex gap-8">
            <div className="flex-1">
              <Skeleton className="h-10 w-64 mb-4" />
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-20 w-full mb-6" />
              <div className="flex gap-4">
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 flex-1" />
              </div>
            </div>
            <div className="w-96">
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="aspect-square" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoadingSearchResults() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-6 w-96 mb-8" />
        <div className="flex gap-8">
          <Skeleton className="hidden lg:block w-80 h-96" />
          <div className="flex-1 space-y-6">
            {[1, 2, 3].map((i) => (
              <LoadingBusinessCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
