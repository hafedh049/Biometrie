import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="border rounded-lg p-6 space-y-6">
        <Skeleton className="h-8 w-48" />

        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full md:w-1/2" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-full md:w-1/2" />
          </div>

          <div className="pt-4">
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-6 space-y-6">
        <Skeleton className="h-8 w-64" />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>

          <Skeleton className="h-32 w-full" />

          <div className="pt-2">
            <Skeleton className="h-10 w-48" />
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-6 space-y-6">
        <Skeleton className="h-8 w-56" />

        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>

          <div className="pt-2">
            <Skeleton className="h-10 w-48" />
          </div>
        </div>
      </div>
    </div>
  )
}
