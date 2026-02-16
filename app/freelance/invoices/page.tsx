import { FreelanceInvoicesManager } from "@/features/freelance/components/freelance-invoices-manager";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";

export default function FreelanceInvoicesPage() {
  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Factures</LayoutTitle>
        <LayoutDescription>
          Émission, numérotation atomique, suivi des statuts et encaissements.
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent>
        <FreelanceInvoicesManager />
      </LayoutContent>
    </Layout>
  );
}
