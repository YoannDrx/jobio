import { FreelanceCatalogManager } from "@/features/freelance/components/freelance-catalog-manager";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";

export default function FreelanceCatalogPage() {
  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Catalogue</LayoutTitle>
        <LayoutDescription>
          Prestations et lignes standard pour accélérer la création de devis et
          factures.
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent>
        <FreelanceCatalogManager />
      </LayoutContent>
    </Layout>
  );
}
