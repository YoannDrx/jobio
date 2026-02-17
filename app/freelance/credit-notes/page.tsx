import { FreelanceCreditNotesManager } from "@/features/freelance/components/freelance-credit-notes-manager";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";

export default function FreelanceCreditNotesPage() {
  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Avoirs</LayoutTitle>
        <LayoutDescription>
          Gestion des annulations et corrections avec traçabilité complète.
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent>
        <FreelanceCreditNotesManager />
      </LayoutContent>
    </Layout>
  );
}
