import { FreelanceBillingProfileForm } from "@/features/freelance/components/freelance-billing-profile-form";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";

export default function FreelanceSettingsPage() {
  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Paramètres de facturation</LayoutTitle>
        <LayoutDescription>
          Profil légal, séquences de numérotation et préférences documentaires.
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent>
        <FreelanceBillingProfileForm />
      </LayoutContent>
    </Layout>
  );
}
