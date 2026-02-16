import { FreelancePaymentsList } from "@/features/freelance/components/freelance-payments-list";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";

export default function FreelancePaymentsPage() {
  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Paiements</LayoutTitle>
        <LayoutDescription>
          Encaissements partiels et totaux, allocations sur facture et suivi du
          solde restant dû.
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent>
        <FreelancePaymentsList />
      </LayoutContent>
    </Layout>
  );
}
