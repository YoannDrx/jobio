import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBillingDashboardSnapshotAction } from "@/features/freelance/billing-documents.action";
import { FreelanceDashboardCharts } from "@/features/freelance/components/freelance-dashboard-charts";
import { FreelanceSetupBanner } from "@/features/freelance/components/freelance-setup-banner";
import { FreelanceOnboardingWizard } from "@/features/freelance/onboarding/freelance-onboarding-wizard";
import { getFreelanceOnboardingStatusAction } from "@/features/freelance/onboarding/freelance-onboarding.action";
import { FreelanceUrgentActions } from "@/features/freelance/components/freelance-urgent-actions";
import {
  formatCents,
  formatDate,
} from "@/features/freelance/billing-presenter";
import { getBillingProfileAction } from "@/features/freelance/billing-clients.action";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { checkPlanLimit } from "@/lib/plan-limits";
import {
  CalendarRange,
  ChartNoAxesCombined,
  CheckCircle2,
  CreditCard,
} from "lucide-react";

export default async function FreelanceDashboardPage() {
  const user = await getRequiredUser();

  const [
    snapshot,
    billingClients,
    billingQuotes,
    billingInvoices,
    billingProfile,
    onboardingStatus,
  ] = await Promise.all([
    resolveActionResult(getBillingDashboardSnapshotAction({})).catch(() => ({
      turnoverInvoicedCurrentMonthCents: 0,
      outstandingCents: 0,
      collectedCents: 0,
      overdueCount: 0,
      quoteToValidateCount: 0,
      declarations: [],
      charts: {
        revenueTimeline: [],
        statusBreakdown: [],
        topClients: [],
        declarationBreakdown: [],
      },
    })),
    checkPlanLimit(user.id, "billingClients"),
    checkPlanLimit(user.id, "billingQuotes"),
    checkPlanLimit(user.id, "billingInvoices"),
    resolveActionResult(getBillingProfileAction({})).catch(() => null),
    resolveActionResult(getFreelanceOnboardingStatusAction()).catch(() => null),
  ]);

  const nextDeclaration = snapshot.declarations.at(0);

  const isProfileIncomplete =
    !billingProfile?.legalName || !billingProfile.siret;

  const kpis = [
    {
      label: "CA facturé",
      value: formatCents(snapshot.turnoverInvoicedCurrentMonthCents),
      hint: "Ce mois",
      icon: ChartNoAxesCombined,
    },
    {
      label: "À encaisser",
      value: formatCents(snapshot.outstandingCents),
      hint: `${snapshot.overdueCount} facture(s) en retard`,
      icon: CreditCard,
    },
    {
      label: "Déclarations URSSAF",
      value: nextDeclaration?.periodKey ?? "Aucune échéance",
      hint: nextDeclaration?.dueDate
        ? `Échéance ${formatDate(nextDeclaration.dueDate)}`
        : "Pas d’échéance enregistrée",
      icon: CalendarRange,
    },
    {
      label: "Conformité",
      value: "Audit actif",
      hint: `${snapshot.quoteToValidateCount} devis à traiter`,
      icon: CheckCircle2,
    },
  ] as const;

  const billingUsage = [
    { label: "Clients", usage: billingClients },
    { label: "Devis", usage: billingQuotes },
    { label: "Factures", usage: billingInvoices },
  ] as const;

  const formatLimit = (value: number) => {
    return value >= 999999 ? "Illimité" : `${value}`;
  };

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Gestion</LayoutTitle>
        <LayoutDescription>
          Gère ta facturation de bout en bout: clients, devis, factures,
          paiements et suivi URSSAF.
        </LayoutDescription>
      </LayoutHeader>
      {onboardingStatus &&
      !onboardingStatus.isDismissed &&
      !onboardingStatus.isComplete ? (
        <LayoutContent>
          <FreelanceOnboardingWizard status={onboardingStatus} />
        </LayoutContent>
      ) : onboardingStatus?.isDismissed && isProfileIncomplete ? (
        <LayoutContent>
          <FreelanceSetupBanner />
        </LayoutContent>
      ) : isProfileIncomplete && !onboardingStatus ? (
        <LayoutContent>
          <FreelanceSetupBanner />
        </LayoutContent>
      ) : null}
      <LayoutContent>
        <FreelanceUrgentActions
          overdueCount={snapshot.overdueCount}
          quoteToValidateCount={snapshot.quoteToValidateCount}
          nextDeclaration={nextDeclaration}
        />
      </LayoutContent>
      <LayoutContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
              <kpi.icon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-muted-foreground text-xs">{kpi.hint}</p>
            </CardContent>
          </Card>
        ))}
      </LayoutContent>
      <LayoutContent>
        <FreelanceDashboardCharts charts={snapshot.charts} />
      </LayoutContent>
      <LayoutContent className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pilotage</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {snapshot.declarations.length > 0
              ? `${snapshot.declarations.length} période(s) de déclaration ouverte(s).`
              : "Aucune période de déclaration ouverte."}{" "}
            Les journaux d’audit, le registre clients et les workflows de devis
            et factures sont déjà actifs.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Capacité du plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {billingUsage.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium tabular-nums">
                  {item.usage.used}/{formatLimit(item.usage.limit)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </LayoutContent>
    </Layout>
  );
}
