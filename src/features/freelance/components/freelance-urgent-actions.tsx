import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, Calendar } from "lucide-react";
import Link from "next/link";

type UrgentAction = {
  label: string;
  description: string;
  href: string;
  variant: "destructive" | "warning" | "info";
  count?: number;
};

type FreelanceUrgentActionsProps = {
  overdueCount: number;
  quoteToValidateCount: number;
  nextDeclaration?: {
    periodKey: string;
    dueDate: Date | string | null;
  } | null;
};

function getDeclarationDaysRemaining(
  dueDate: Date | string | null,
): number | null {
  if (!dueDate) return null;

  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

function isDeclarationSoon(daysRemaining: number | null): boolean {
  return daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
}

export function FreelanceUrgentActions({
  overdueCount,
  quoteToValidateCount,
  nextDeclaration,
}: FreelanceUrgentActionsProps) {
  const daysRemaining = getDeclarationDaysRemaining(
    nextDeclaration?.dueDate ?? null,
  );
  const showDeclarationAlert = isDeclarationSoon(daysRemaining);

  // Don't render if nothing is urgent
  if (
    overdueCount === 0 &&
    quoteToValidateCount === 0 &&
    !showDeclarationAlert
  ) {
    return null;
  }

  const actions: UrgentAction[] = [];

  if (overdueCount > 0) {
    actions.push({
      label: `${overdueCount} facture${overdueCount > 1 ? "s" : ""} en retard de paiement`,
      description: "Relancer vos clients pour les paiements non reçus",
      href: "/freelance/invoices",
      variant: "destructive",
      count: overdueCount,
    });
  }

  if (quoteToValidateCount > 0) {
    actions.push({
      label: `${quoteToValidateCount} devis en attente d'acceptation`,
      description: "Vérifiez et acceptez vos devis en attente",
      href: "/freelance/quotes",
      variant: "warning",
      count: quoteToValidateCount,
    });
  }

  if (showDeclarationAlert && nextDeclaration) {
    actions.push({
      label: `Déclaration URSSAF ${nextDeclaration.periodKey} dans ${daysRemaining} jour${daysRemaining !== 1 ? "s" : ""}`,
      description: "Complétez votre déclaration avant la date limite",
      href: "/freelance/insights",
      variant: "info",
    });
  }

  const getIconColor = (variant: "destructive" | "warning" | "info") => {
    switch (variant) {
      case "destructive":
        return "text-red-600";
      case "warning":
        return "text-amber-600";
      case "info":
        return "text-blue-600";
    }
  };

  const getBorderColor = (variant: "destructive" | "warning" | "info") => {
    switch (variant) {
      case "destructive":
        return "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950";
      case "warning":
        return "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950";
      case "info":
        return "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950";
    }
  };

  const getIcon = (variant: "destructive" | "warning" | "info") => {
    switch (variant) {
      case "destructive":
        return (
          <AlertCircle
            className={`size-5 ${getIconColor(variant)} flex-shrink-0`}
          />
        );
      case "warning":
        return (
          <AlertTriangle
            className={`size-5 ${getIconColor(variant)} flex-shrink-0`}
          />
        );
      case "info":
        return (
          <Calendar
            className={`size-5 ${getIconColor(variant)} flex-shrink-0`}
          />
        );
    }
  };

  return (
    <Card className={`border ${getBorderColor(actions[0].variant)}`}>
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">{getIcon(actions[0].variant)}</div>

          <div className="flex-grow space-y-3">
            <h3 className="text-foreground font-semibold">Actions urgentes</h3>

            {actions.map((action) => (
              <div
                key={action.href}
                className="flex items-center justify-between gap-3 rounded-md bg-white/50 p-3 dark:bg-black/20"
              >
                <div className="flex-grow">
                  <p className="text-foreground text-sm font-medium">
                    {action.label}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {action.description}
                  </p>
                </div>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="flex-shrink-0"
                >
                  <Link href={action.href}>
                    Voir
                    <span className="text-xs">→</span>
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
