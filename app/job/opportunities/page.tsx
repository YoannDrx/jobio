import { getRequiredUser } from "@/lib/auth/auth-user";
import { checkPlanFeature } from "@/lib/plan-limits";
import { getOpportunityDashboard } from "@/features/opportunities/opportunity-service";
import { OpportunitiesWorkspace } from "@/features/opportunities/components/opportunities-workspace";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";

export default async function OpportunitiesPage() {
  const user = await getRequiredUser();
  const [dashboard, automatedDiscoveryEnabled] = await Promise.all([
    getOpportunityDashboard(user.id),
    checkPlanFeature(user.id, "opportunityDiscovery"),
  ]);

  return (
    <Layout size="xl">
      <LayoutHeader>
        <LayoutTitle>Radar Missions</LayoutTitle>
        <LayoutDescription>
          Détecte, qualifie et compare les opportunités avant de choisir celles
          qui méritent une place dans ton pipeline.
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent>
        <OpportunitiesWorkspace
          automatedDiscoveryEnabled={automatedDiscoveryEnabled}
          initialData={dashboard}
        />
      </LayoutContent>
    </Layout>
  );
}
