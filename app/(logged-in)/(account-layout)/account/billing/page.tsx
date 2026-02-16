import {
  Layout,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { Pricing } from "@/features/plans/pricing-section";
import { combineWithParentMetadata } from "@/lib/metadata";
import { checkPlanLimit } from "@/lib/plan-limits";
import { getRequiredCurrentUser } from "@/lib/user/get-user";
import { getUserActiveSubscription } from "@/lib/user/get-user-subscription";
import { UserBilling } from "./user-billing";

export const generateMetadata = combineWithParentMetadata({
  title: "Facturation",
  description: "Gère ton abonnement.",
});

export default async function OrgBillingPage() {
  const subscription = await getUserActiveSubscription();

  if (!subscription) {
    return (
      <>
        <Layout size="lg">
          <LayoutHeader>
            <LayoutTitle>Plan gratuit</LayoutTitle>
            <LayoutDescription>
              Passe en Premium pour débloquer toutes les fonctionnalités.
            </LayoutDescription>
          </LayoutHeader>
        </Layout>
        <Pricing />
      </>
    );
  }

  const user = await getRequiredCurrentUser();

  const [
    missions,
    profiles,
    contacts,
    platforms,
    aiRequestsPerMonth,
    billingClients,
    billingQuotes,
    billingInvoices,
    billingCatalogItems,
  ] = await Promise.all([
    checkPlanLimit(user.id, "missions"),
    checkPlanLimit(user.id, "profiles"),
    checkPlanLimit(user.id, "contacts"),
    checkPlanLimit(user.id, "platforms"),
    checkPlanLimit(user.id, "aiRequestsPerMonth"),
    checkPlanLimit(user.id, "billingClients"),
    checkPlanLimit(user.id, "billingQuotes"),
    checkPlanLimit(user.id, "billingInvoices"),
    checkPlanLimit(user.id, "billingCatalogItems"),
  ]);

  const usage = {
    missions,
    profiles,
    contacts,
    platforms,
    aiRequestsPerMonth,
    billingClients,
    billingQuotes,
    billingInvoices,
    billingCatalogItems,
  };

  return <UserBilling subscription={subscription} usage={usage} />;
}
