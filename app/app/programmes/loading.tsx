import { Skeleton } from "@/components/ui/skeleton";
import { Layout, LayoutContent, LayoutHeader } from "@/features/page/layout";

export default function ProgrammesLoading() {
  return (
    <Layout size="lg">
      <LayoutHeader>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-5 w-96" />
      </LayoutHeader>
      <LayoutContent>
        <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-xl" />
          ))}
        </div>
      </LayoutContent>
    </Layout>
  );
}
