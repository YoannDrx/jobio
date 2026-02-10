import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";

export default async function AppUsersPage() {
  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Analytics</LayoutTitle>
      </LayoutHeader>
      <LayoutContent className="flex flex-col gap-4 lg:gap-8">
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold">User Analytics</h3>
          <p className="text-muted-foreground mt-2">
            Your personal analytics and usage statistics will be displayed here.
          </p>
        </div>
      </LayoutContent>
    </Layout>
  );
}
