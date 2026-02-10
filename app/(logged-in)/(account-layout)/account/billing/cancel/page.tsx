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
        <LayoutTitle>Cancel Subscription</LayoutTitle>
        <LayoutDescription>
          We're sorry to see you go. Please let us know why you're cancelling so
          we can improve our service.
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent>
        <CancelSubscriptionForm />
      </LayoutContent>
    </Layout>
  );
}
