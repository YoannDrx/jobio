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
          Émission, encaissements et suivi des échéances depuis un registre
          unique.
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent>
        <FreelanceInvoicesManager />
      </LayoutContent>
    </Layout>
  );
}
