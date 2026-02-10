import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getRequiredUser } from "@/lib/auth/auth-user";
import InformationCards from "./_components/information-cards";
import { SubscribersChart } from "./_components/subscribers-charts";

export default async function RoutePage() {
  await getRequiredUser();
  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Dashboard</LayoutTitle>
      </LayoutHeader>
      <LayoutActions></LayoutActions>
      <LayoutContent className="flex flex-col gap-4 lg:gap-8">
        <InformationCards />
        <SubscribersChart />
      </LayoutContent>
    </Layout>
  );
}
