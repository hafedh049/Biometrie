import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/4">
          <div className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
            </div>
          </div>
        </div>

        <div className="md:w-3/4">
          <div className="border rounded-lg p-6 space-y-6">
            <Skeleton className="h-8 w-48" />

            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-10 w-full" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-32 w-full" />
              </div>

              <div className="pt-4">
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6 space-y-6 mt-6">
            <Skeleton className="h-8 w-56" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>

              <div className="border rounded-lg p-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-10 w-full" />
                  <div className="pt-2">
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
