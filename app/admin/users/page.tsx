import { Skeleton } from "@/components/ui/skeleton";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getRequiredAdmin } from "@/lib/auth/auth-user";
import { Suspense } from "react";
import { searchParamsCache } from "./_actions/search-params";
import { AdminFilters } from "./_components/admin-filters";
import { UserTable } from "./_components/user-table";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  await getRequiredAdmin();

  const params = await searchParamsCache.parse(searchParams);

  return (
    <Layout size="xl">
      <LayoutHeader>
        <LayoutTitle>Gestion utilisateurs</LayoutTitle>
        <LayoutDescription>
          Filtre, trie et exporte les comptes utilisateurs avec des signaux
          d&apos;activité exploitables.
        </LayoutDescription>
      </LayoutHeader>

      <LayoutContent>
        <div className="space-y-4">
          <AdminFilters />

          <Suspense fallback={<UserTableSkeleton />}>
            <UserTable searchParams={params} />
          </Suspense>
        </div>
      </LayoutContent>
    </Layout>
  );
}

const UserTableSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 10 }).map((_, i) => (
      <Skeleton key={i} className="h-16 w-full" />
    ))}
  </div>
);
