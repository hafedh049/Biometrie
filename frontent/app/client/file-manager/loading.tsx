import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/4 space-y-6">
          <div className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ))}
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-3">
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <Skeleton className="h-2.5 w-2/3 rounded-full" />
                </div>
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <Skeleton className="h-2.5 w-1/4 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:w-3/4 space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <div className="flex space-x-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-10" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg">
                    <Skeleton className="h-16 w-16" />
                  </div>
                  <Skeleton className="h-5 w-3/4" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
          </div>

          <div className="flex justify-center">
            <Skeleton className="h-10 w-64" />
          </div>
        </div>
      </div>
    </div>
  )
}
