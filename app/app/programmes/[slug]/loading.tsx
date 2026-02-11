import { Skeleton } from "@/components/ui/skeleton";
import { Layout, LayoutContent, LayoutHeader } from "@/features/page/layout";

export default function ProgrammeDetailLoading() {
  return (
    <Layout size="lg">
      <LayoutHeader>
        <Skeleton className="h-6 w-24" />
        <Skeleton className="mt-2 h-8 w-80" />
        <Skeleton className="mt-1 h-5 w-48" />
      </LayoutHeader>
      <LayoutContent>
        <Skeleton className="mt-6 h-24 w-full rounded-xl" />
        <div className="mt-6 flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </LayoutContent>
    </Layout>
  );
}
