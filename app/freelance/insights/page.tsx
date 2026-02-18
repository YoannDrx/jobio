import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getBillingProfileAction } from "@/features/freelance/billing-clients.action";
import { getBillingDashboardSnapshotAction } from "@/features/freelance/billing-documents.action";
import {
  buildBillingComplianceChecklist,
  freelanceStatusLabel,
  parseFreelanceStatus,
  resolveBillingCompliancePreset,
} from "@/features/freelance/billing-compliance-rules";
import { FreelanceAiForecastPanel } from "@/features/freelance/components/freelance-ai-forecast-panel";
import { FreelanceDeclarationsBuilder } from "@/features/freelance/components/freelance-declarations-builder";
import { FreelanceDeclarationsChart } from "@/features/freelance/components/freelance-declarations-chart";
import {
  formatCents,
  formatDate,
} from "@/features/freelance/billing-presenter";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { getPlanLimits } from "@/lib/auth/stripe/auth-plans";
import { getRequiredCurrentUser } from "@/lib/user/get-user";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function FreelanceInsightsPage() {
  const user = await getRequiredCurrentUser();
  const [snapshot, billingProfile] = await Promise.all([
    resolveActionResult(getBillingDashboardSnapshotAction({})).catch(() => ({
      turnoverInvoicedCurrentMonthCents: 0,
      outstandingCents: 0,
      collectedCents: 0,
      overdueCount: 0,
      quoteToValidateCount: 0,
      declarations: [],
    })),
    resolveActionResult(getBillingProfileAction({})).catch(() => null),
  ]);

  const compliancePreset = resolveBillingCompliancePreset({
    freelanceStatus: billingProfile?.freelanceStatus ?? null,
    activityCategory: billingProfile?.activityCategory ?? null,
  });

  const complianceChecklist = buildBillingComplianceChecklist({
    freelanceStatus: billingProfile?.freelanceStatus ?? null,
    activityCategory: billingProfile?.activityCategory ?? null,
    legalName: billingProfile?.legalName ?? null,
    legalForm: billingProfile?.legalForm ?? null,
    siret: billingProfile?.siret ?? null,
    addressLine1: billingProfile?.addressLine1 ?? null,
    postalCode: billingProfile?.postalCode ?? null,
    city: billingProfile?.city ?? null,
    countryCode: billingProfile?.countryCode ?? null,
    email: billingProfile?.email ?? null,
    vatNumber: billingProfile?.vatNumber ?? null,
    vatExemptionMention: billingProfile?.vatExemptionMention ?? null,
    iban: billingProfile?.iban ?? null,
    bic: billingProfile?.bic ?? null,
    documentShowBankDetails: billingProfile?.documentShowBankDetails ?? true,
  });

  const requiredMissing = complianceChecklist.filter(
    (item) => item.required && !item.ok,
  );
  const currentStatus = parseFreelanceStatus(
    billingProfile?.freelanceStatus ?? null,
  );
  const statusLabel = currentStatus
    ? freelanceStatusLabel[currentStatus]
    : compliancePreset.statusLabel;
  const planLimits = getPlanLimits(user.subscription?.plan ?? "free");
  const freePlanLimits = getPlanLimits("free");
  const canUseAIForecast =
    planLimits.aiRequestsPerMonth > freePlanLimits.aiRequestsPerMonth;

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>URSSAF & activité</LayoutTitle>
        <LayoutDescription>
          Vue consolidée du chiffre d’affaires et des projections de charges.
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent>
        <FreelanceDeclarationsBuilder />
      </LayoutContent>
      <LayoutContent>
        {canUseAIForecast ? (
          <FreelanceAiForecastPanel />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Prévision IA</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <p className="text-muted-foreground">
                Les projections IA (90 jours, risques, recommandations) sont
                incluses à partir du plan Pro.
              </p>
              <div>
                <Button asChild size="sm">
                  <Link href="/account/billing">Passer en Pro</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </LayoutContent>
      <LayoutContent>
        <Card>
          <CardHeader>
            <CardTitle>Conformité statut & régime</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Statut: <span className="font-medium">{statusLabel}</span>
            </p>
            <p>
              Référence URSSAF:{" "}
              <span className="font-medium">
                {compliancePreset.defaultContributionRatePercent}% -{" "}
                {compliancePreset.defaultDeclarationType === "MONTHLY"
                  ? "mensuel"
                  : "trimestriel"}
              </span>
            </p>
            {requiredMissing.length === 0 ? (
              <p className="text-emerald-700">
                Checklist légale requise: complète.
              </p>
            ) : (
              <div className="text-amber-700">
                <p>
                  Checklist légale: {requiredMissing.length} élément(s) requis à
                  compléter.
                </p>
                {requiredMissing.slice(0, 3).map((item) => (
                  <p key={item.id}>• {item.label}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </LayoutContent>
      <LayoutContent>
        <Card>
          <CardHeader>
            <CardTitle>Analyse déclarative</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm md:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-xs">
                CA facturé ce mois
              </p>
              <p className="text-lg font-semibold">
                {formatCents(snapshot.turnoverInvoicedCurrentMonthCents)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">
                Encaissements cumulés
              </p>
              <p className="text-lg font-semibold">
                {formatCents(snapshot.collectedCents)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Reste à encaisser</p>
              <p className="text-lg font-semibold">
                {formatCents(snapshot.outstandingCents)}
              </p>
            </div>
          </CardContent>
        </Card>
      </LayoutContent>
      <LayoutContent>
        <Card>
          <CardHeader>
            <CardTitle>Historique des déclarations</CardTitle>
          </CardHeader>
          <CardContent>
            <FreelanceDeclarationsChart declarations={snapshot.declarations} />
          </CardContent>
        </Card>
      </LayoutContent>
      <LayoutContent>
        <Card>
          <CardHeader>
            <CardTitle>Détail des périodes</CardTitle>
          </CardHeader>
          <CardContent>
            {snapshot.declarations.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aucune période enregistrée pour le moment.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Période</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Facturé</TableHead>
                    <TableHead>Encaissé</TableHead>
                    <TableHead>Charges estimées</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshot.declarations.map((period) => (
                    <TableRow key={period.id}>
                      <TableCell>{period.periodKey}</TableCell>
                      <TableCell>{period.type}</TableCell>
                      <TableCell>{formatDate(period.dueDate)}</TableCell>
                      <TableCell>{formatCents(period.invoicedCents)}</TableCell>
                      <TableCell>
                        {formatCents(period.collectedCents)}
                      </TableCell>
                      <TableCell>
                        {formatCents(period.socialChargesCents)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </LayoutContent>
    </Layout>
  );
}
