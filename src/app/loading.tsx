import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex h-16 items-center px-4 border-b shrink-0">
        <Skeleton className="h-8 w-32" />
        <div className="ml-auto flex items-center space-x-4">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r hidden md:block p-4 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex-1 p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
