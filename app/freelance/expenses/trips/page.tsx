import { FreelanceExpenseTripsManager } from "@/features/freelance/components/freelance-expense-trips-manager";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";

export default function FreelanceTripsPage() {
  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Dépenses · Trajets</LayoutTitle>
        <LayoutDescription>
          Suis les déplacements professionnels et calcule les indemnités.
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent>
        <FreelanceExpenseTripsManager />
      </LayoutContent>
    </Layout>
  );
}
