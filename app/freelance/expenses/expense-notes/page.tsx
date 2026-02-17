import { FreelanceExpenseNotesManager } from "@/features/freelance/components/freelance-expense-notes-manager";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";

export default function FreelanceExpenseNotesPage() {
  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Dépenses · Notes de frais</LayoutTitle>
        <LayoutDescription>
          Gère les justificatifs et les remboursements de frais opérationnels.
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent>
        <FreelanceExpenseNotesManager />
      </LayoutContent>
    </Layout>
  );
}
