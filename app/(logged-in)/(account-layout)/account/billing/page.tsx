import {
  Layout,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { Pricing } from "@/features/plans/pricing-section";
import { getPlanLimitsForPlan } from "@/lib/auth/stripe/plan-entitlements";
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
        <Pricing entryPoint="billing_page" />
      </>
    );
  }

  const user = await getRequiredCurrentUser();
  const plan = subscription.plan;
  const limits = await getPlanLimitsForPlan(plan);

  const [
    missions,
    profiles,
    contacts,
    platforms,
    companies,
    aiRequestsPerMonth,
    billingClients,
    billingQuotes,
    billingInvoices,
    billingCatalogItems,
    cvDocuments,
    sequences,
    messageTemplates,
  ] = await Promise.all([
    checkPlanLimit(user.id, "missions", { plan, limits }),
    checkPlanLimit(user.id, "profiles", { plan, limits }),
    checkPlanLimit(user.id, "contacts", { plan, limits }),
    checkPlanLimit(user.id, "platforms", { plan, limits }),
    checkPlanLimit(user.id, "companies", { plan, limits }),
    checkPlanLimit(user.id, "aiRequestsPerMonth", { plan, limits }),
    checkPlanLimit(user.id, "billingClients", { plan, limits }),
    checkPlanLimit(user.id, "billingQuotes", { plan, limits }),
    checkPlanLimit(user.id, "billingInvoices", { plan, limits }),
    checkPlanLimit(user.id, "billingCatalogItems", { plan, limits }),
    checkPlanLimit(user.id, "cvDocuments", { plan, limits }),
    checkPlanLimit(user.id, "sequences", { plan, limits }),
    checkPlanLimit(user.id, "messageTemplates", { plan, limits }),
  ]);

  const usage = {
    missions,
    profiles,
    contacts,
    platforms,
    companies,
    aiRequestsPerMonth,
    billingClients,
    billingQuotes,
    billingInvoices,
    billingCatalogItems,
    cvDocuments,
    sequences,
    messageTemplates,
  };

  return (
    <UserBilling subscription={subscription} usage={usage} planLimits={limits} />
  );
}
