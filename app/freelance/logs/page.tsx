import { FreelanceAuditLogList } from "@/features/freelance/components/freelance-audit-log-list";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";

export default function FreelanceLogsPage() {
  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Logs d’activité</LayoutTitle>
        <LayoutDescription>
          Journal append-only de toutes les opérations de facturation.
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent>
        <FreelanceAuditLogList />
      </LayoutContent>
    </Layout>
  );
}
