import { FreelanceRegistersManager } from "@/features/freelance/components/freelance-registers-manager";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import {
  getPlanLimitsForPlan,
  resolvePlanLimitsForUser,
} from "@/lib/auth/stripe/plan-entitlements";
import { getRequiredCurrentUser } from "@/lib/user/get-user";

export default async function FreelanceRegistersPage() {
  const user = await getRequiredCurrentUser();
  const [{ limits }, freePlanLimits] = await Promise.all([
    resolvePlanLimitsForUser(user.id),
    getPlanLimitsForPlan("free"),
  ]);
  const canUseAdvancedExports =
    limits.billingQuotes > freePlanLimits.billingQuotes;

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Registres & exports</LayoutTitle>
        <LayoutDescription>
          Exports ventes/paiements et préparation des flux comptables.
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent>
        <FreelanceRegistersManager
          canUseAdvancedExports={canUseAdvancedExports}
        />
      </LayoutContent>
    </Layout>
  );
}
