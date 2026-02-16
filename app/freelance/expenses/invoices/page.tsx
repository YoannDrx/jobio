import { FreelanceExpenseInvoicesManager } from "@/features/freelance/components/freelance-expense-invoices-manager";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";

export default function FreelanceExpenseInvoicesPage() {
  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Dépenses · Factures</LayoutTitle>
        <LayoutDescription>
          Centralise tes factures fournisseurs et prépare le matching comptable.
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent>
        <FreelanceExpenseInvoicesManager />
      </LayoutContent>
    </Layout>
  );
}
