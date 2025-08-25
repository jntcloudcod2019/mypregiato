import { Skeleton } from "./skeleton"
import { Card, CardContent } from "./card"

export const TalentCardSkeleton = () => {
  return (
    <Card className="w-72 h-96 mx-3 overflow-hidden">
      <div className="relative h-64">
        <Skeleton className="w-full h-full" />
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

export const UserTableSkeleton = () => {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="grid grid-cols-12 gap-4 items-center py-3 border-b border-border/50">
          <div className="col-span-3">
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="col-span-3">
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="col-span-2 flex gap-2">
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}