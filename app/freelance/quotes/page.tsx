import { FreelanceQuotesManager } from "@/features/freelance/components/freelance-quotes-manager";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";

export default function FreelanceQuotesPage() {
  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Devis</LayoutTitle>
        <LayoutDescription>
          Création de devis, versioning et conversion en facture depuis le même
          workflow.
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent>
        <FreelanceQuotesManager />
      </LayoutContent>
    </Layout>
  );
}
