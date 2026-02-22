"use client";

import { Typography } from "@/components/nowts/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { LoadingButton } from "@/features/form/submit-button";
import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  LIMITS_CONFIG,
  type PlanLimit,
} from "@/lib/auth/stripe/auth-plans";
import type { UserActiveSubscription } from "@/lib/user/get-user-subscription";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { dayjs } from "@/lib/dayjs";
import {
  AlertCircle,
  ArrowUpCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  XCircle,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { openStripePortalAction } from "./billing.action";

type UsageData = Record<string, { used: number; limit: number }>;

const BOOLEAN_LIMIT_KEYS = new Set([
  "cvTemplatesAll",
  "cvCoachAI",
  "atsScoring",
  "autoFollowUps",
  "csvExport",
  "aiEmailGeneration",
  "aiLinkedinAudit",
]);

const DISPLAY_ONLY_LIMIT_KEYS = new Set(["analyticsHistoryDays"]);

export function UserBilling(props: {
  subscription: UserActiveSubscription;
  usage: UsageData;
  planLimits: PlanLimit;
}) {
  const subscription = props.subscription;
  const usage = props.usage;
  const planLimits = props.planLimits;
  const router = useRouter();

  const manageSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const stripeCustomerId = subscription.stripeCustomerId;

      if (!stripeCustomerId) {
        throw new Error("No stripe customer id found");
      }

      const stripeBilling = await resolveActionResult(openStripePortalAction());

      router.push(stripeBilling.url);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const statusConfig =
    STATUS_CONFIG[subscription.status as keyof typeof STATUS_CONFIG];
  const StatusIcon = statusConfig.icon;

  // Calculate days remaining in trial if applicable
  const daysRemaining =
    subscription.status === "trialing"
      ? dayjs(subscription.periodEnd ?? new Date()).diff(dayjs(), "day")
      : 0;

  const trialProgress =
    subscription.status === "trialing" ? 100 - (daysRemaining / 14) * 100 : 0;

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Facturation</LayoutTitle>
      </LayoutHeader>
      <LayoutActions className="gap-2">
        <LoadingButton
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => manageSubscriptionMutation.mutate()}
          loading={manageSubscriptionMutation.isPending}
        >
          <ArrowUpCircle className="mr-2 size-4" />
          Gérer l'abonnement
        </LoadingButton>

        {subscription.status === "trialing" ? (
          <Button
            className="w-full sm:w-auto"
            onClick={() => manageSubscriptionMutation.mutate()}
            disabled={manageSubscriptionMutation.isPending}
          >
            <Zap className="mr-2 size-4" />
            Passer à Pro
          </Button>
        ) : subscription.status === "active" ? (
          <>
            {!subscription.cancelAtPeriodEnd && (
              <Button
                variant="destructive"
                onClick={() => router.push(`/account/billing/cancel`)}
              >
                <XCircle className="mr-2 size-4" />
                Annuler l'abonnement
              </Button>
            )}
          </>
        ) : (
          <Button className="w-full sm:w-auto">
            <CreditCard className="mr-2 size-4" />
            Réactiver l'abonnement
          </Button>
        )}
      </LayoutActions>
      <LayoutContent className="flex flex-col gap-4">
        {subscription.status === "trialing" && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-950/20">
            <CardContent className="flex flex-col gap-3 p-6">
              <div className="flex items-center gap-3">
                <Clock className="size-5 text-amber-600 dark:text-amber-400" />
                <div className="flex-1">
                  <p className="font-semibold text-amber-900 dark:text-amber-100">
                    Période d'essai — Expire dans {daysRemaining} jour
                    {daysRemaining > 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Finalise ton abonnement avant la fin de la période d'essai
                    pour ne pas perdre l'accès à tes données.
                  </p>
                </div>
              </div>
              <Progress value={trialProgress} className="h-2" />
            </CardContent>
          </Card>
        )}
        {/* Status Information */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <StatusIcon className={cn("size-5", statusConfig.textColor)} />
            <CardTitle>{statusConfig.description}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {subscription.cancelAtPeriodEnd && (
              <Typography variant="muted">
                Ton abonnement se terminera le{" "}
                {dayjs(subscription.periodEnd ?? new Date()).format(
                  "D MMMM YYYY",
                )}
              </Typography>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Détails de l'abonnement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <Typography variant="muted">Plan :</Typography>
              <Typography className="capitalize">
                {subscription.plan}
              </Typography>
            </div>
            <div className="flex justify-between">
              <Typography variant="muted">Date de début :</Typography>
              <Typography>
                {dayjs(subscription.periodStart ?? new Date()).format(
                  "D MMMM YYYY",
                )}
              </Typography>
            </div>
            <div className="flex justify-between">
              <Typography variant="muted">Renouvellement :</Typography>
              <Typography>
                {dayjs(subscription.periodEnd ?? new Date()).format(
                  "D MMMM YYYY",
                )}
              </Typography>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Limites du plan</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {Object.entries(planLimits).map(([key, total]) => {
              const limitConfig =
                LIMITS_CONFIG[key as keyof typeof LIMITS_CONFIG];

              const Icon = limitConfig.icon;
              const isBoolean = BOOLEAN_LIMIT_KEYS.has(key);
              const isDisplayOnly = DISPLAY_ONLY_LIMIT_KEYS.has(key);
              const used =
                (usage[key] as { used: number; limit: number } | undefined)
                  ?.used ?? 0;
              const percentage =
                !isBoolean && !isDisplayOnly && total > 0
                  ? (used / total) * 100
                  : 0;

              return (
                <div key={key} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="text-primary size-4" />
                      <Typography variant="muted" className="text-sm">
                        {limitConfig.getLabel(total)}
                      </Typography>
                    </div>
                    {isBoolean ? (
                      <Typography variant="muted" className="text-xs">
                        {total >= 1 ? "Inclus" : "Non inclus"}
                      </Typography>
                    ) : isDisplayOnly ? (
                      <Typography variant="muted" className="text-xs">
                        Limite du plan
                      </Typography>
                    ) : (
                      <Typography variant="muted" className="text-xs">
                        {used.toLocaleString()} / {total.toLocaleString()}
                      </Typography>
                    )}
                  </div>
                  {!isBoolean && !isDisplayOnly && (
                    <Progress value={percentage} className="h-1" />
                  )}
                  <Typography variant="muted" className="text-xs">
                    {limitConfig.description}
                  </Typography>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </LayoutContent>
    </Layout>
  );
}

// Status configuration with colors and descriptions
const STATUS_CONFIG = {
  trialing: {
    label: "Essai",
    description: "Ton essai gratuit est actif",
    color: "bg-blue-500",
    textColor: "text-blue-500",
    icon: Clock,
  },
  active: {
    label: "Actif",
    description: "Ton abonnement est actif",
    color: "bg-green-500",
    textColor: "text-green-500",
    icon: CheckCircle2,
  },
  canceled: {
    label: "Annulé",
    description: "Ton abonnement a été annulé",
    color: "bg-orange-500",
    textColor: "text-orange-500",
    icon: XCircle,
  },
  past_due: {
    label: "En retard",
    description: "Ton paiement est en retard",
    color: "bg-red-500",
    textColor: "text-red-500",
    icon: AlertCircle,
  },
  unpaid: {
    label: "Impayé",
    description: "Ton abonnement est impayé",
    color: "bg-red-500",
    textColor: "text-red-500",
    icon: AlertCircle,
  },
  incomplete: {
    label: "Incomplet",
    description: "La mise en place de ton abonnement est incomplète",
    color: "bg-yellow-500",
    textColor: "text-yellow-500",
    icon: AlertCircle,
  },
};
