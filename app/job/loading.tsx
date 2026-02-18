import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-4">
        <Skeleton className="h-32 flex-1" />
        <Skeleton className="h-32 flex-1" />
        <Skeleton className="h-32 flex-1" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
