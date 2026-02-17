import { Badge } from "@/components/ui/badge";
import { FreelanceClientsManager } from "@/features/freelance/components/freelance-clients-manager";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";

export default function FreelanceClientsPage() {
  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Clients</LayoutTitle>
        <LayoutDescription>
          Base clients dédiée à la facturation avec identité légale, conditions de
          paiement et historique documentaire.
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent>
        <div className="mb-3">
          <Badge variant="outline">Opérationnel</Badge>
        </div>
        <FreelanceClientsManager />
      </LayoutContent>
    </Layout>
  );
}
