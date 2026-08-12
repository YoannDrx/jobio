import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { CancelSubscriptionForm } from "./cancel-form";

export default async function CancelSubscriptionPage() {
  await getRequiredUser();

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Annuler l’abonnement</LayoutTitle>
        <LayoutDescription>
          Dis-nous ce qui motive ton départ afin de nous aider à améliorer
          Jobio.
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent>
        <CancelSubscriptionForm />
      </LayoutContent>
    </Layout>
  );
}
