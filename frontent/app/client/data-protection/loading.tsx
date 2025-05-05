import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="border rounded-lg p-6 space-y-6">
        <Skeleton className="h-8 w-48" />

        <div className="space-y-4">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex items-center justify-between border-b pb-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
        </div>
      </div>

      <div className="border rounded-lg p-6 space-y-6">
        <Skeleton className="h-8 w-56" />

        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full md:w-3/4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>

          <div className="pt-2">
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-6 space-y-6">
        <Skeleton className="h-8 w-40" />

        <div className="space-y-4">
          {Array(2)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex items-start space-x-3 border-b pb-4">
                <Skeleton className="h-5 w-5 mt-1" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-64" />
                  <Skeleton className="h-4 w-full md:w-3/4" />
                </div>
              </div>
            ))}

          <div className="pt-2">
            <Skeleton className="h-10 w-48" />
          </div>
        </div>
      </div>
    </div>
  )
}
