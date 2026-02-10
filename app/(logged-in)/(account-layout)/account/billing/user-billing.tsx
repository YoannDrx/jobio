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
import { LIMITS_CONFIG, getPlanLimits } from "@/lib/auth/stripe/auth-plans";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { openStripePortalAction } from "./billing.action";

export function UserBilling(props: { subscription: UserActiveSubscription }) {
  const subscription = props.subscription;
  const router = useRouter();

  // Get plan limits and fake current usage
  const planLimits = getPlanLimits(subscription.plan);
  const fakeUsage = {
    missions: Math.floor(planLimits.missions * 0.6),
    profiles: Math.floor(planLimits.profiles * 0.45),
    contacts: Math.floor(planLimits.contacts * 0.8),
    platforms: Math.floor(planLimits.platforms * 0.5),
    aiRequestsPerMonth: Math.floor(planLimits.aiRequestsPerMonth * 0.3),
    analyticsHistoryDays: planLimits.analyticsHistoryDays,
  };

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
        <LayoutTitle>Billing</LayoutTitle>
      </LayoutHeader>
      <LayoutActions>
        <LoadingButton
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => manageSubscriptionMutation.mutate()}
          loading={manageSubscriptionMutation.isPending}
        >
          <ArrowUpCircle className="mr-2 size-4" />
          Manage Subscription
        </LoadingButton>

        {subscription.status === "trialing" ? (
          <></>
        ) : subscription.status === "active" ? (
          <>
            {!subscription.cancelAtPeriodEnd && (
              <Button
                variant="outline"
                onClick={() => router.push(`/account/billing/cancel`)}
              >
                <XCircle className="mr-2 size-4" />
                Cancel Subscription
              </Button>
            )}
          </>
        ) : (
          <Button className="w-full sm:w-auto">
            <CreditCard className="mr-2 size-4" />
            Reactivate Subscription
          </Button>
        )}
      </LayoutActions>
      <LayoutContent className="flex flex-col gap-4">
        {/* Status Information */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <StatusIcon className={cn("size-5", statusConfig.textColor)} />
            <CardTitle>{statusConfig.description}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {subscription.status === "trialing" && (
              <div className="mt-1 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <Typography>
                    Trial period: {daysRemaining} days remaining
                  </Typography>
                </div>
                <Progress value={trialProgress} className="h-2" />
              </div>
            )}
            {subscription.cancelAtPeriodEnd && (
              <Typography variant="muted">
                Your subscription will end on{" "}
                {dayjs(subscription.periodEnd ?? new Date()).format(
                  "MMMM D, YYYY",
                )}
              </Typography>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <Typography variant="muted">Plan:</Typography>
              <Typography className="capitalize">
                {subscription.plan}
              </Typography>
            </div>
            <div className="flex justify-between">
              <Typography variant="muted">Start date:</Typography>
              <Typography>
                {dayjs(subscription.periodStart ?? new Date()).format(
                  "MMMM D, YYYY",
                )}
              </Typography>
            </div>
            <div className="flex justify-between">
              <Typography variant="muted">Renew at:</Typography>
              <Typography>
                {dayjs(subscription.periodEnd ?? new Date()).format(
                  "MMMM D, YYYY",
                )}
              </Typography>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Plan Limits</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {Object.entries(planLimits).map(([key, total]) => {
              const limitConfig =
                LIMITS_CONFIG[key as keyof typeof LIMITS_CONFIG];

              const Icon = limitConfig.icon;
              const used = fakeUsage[key as keyof typeof fakeUsage];
              const percentage = (used / total) * 100;

              return (
                <div key={key} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="text-primary size-4" />
                      <Typography variant="muted" className="text-sm">
                        {limitConfig.getLabel(total)}
                      </Typography>
                    </div>
                    <Typography variant="muted" className="text-xs">
                      {used.toLocaleString()} / {total.toLocaleString()}
                    </Typography>
                  </div>
                  <Progress value={percentage} className="h-1" />
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
    label: "Trial",
    description: "Your free trial is active",
    color: "bg-blue-500",
    textColor: "text-blue-500",
    icon: Clock,
  },
  active: {
    label: "Active",
    description: "Your subscription is active",
    color: "bg-green-500",
    textColor: "text-green-500",
    icon: CheckCircle2,
  },
  canceled: {
    label: "Canceled",
    description: "Your subscription has been canceled",
    color: "bg-orange-500",
    textColor: "text-orange-500",
    icon: XCircle,
  },
  past_due: {
    label: "Past Due",
    description: "Your payment is past due",
    color: "bg-red-500",
    textColor: "text-red-500",
    icon: AlertCircle,
  },
  unpaid: {
    label: "Unpaid",
    description: "Your subscription is unpaid",
    color: "bg-red-500",
    textColor: "text-red-500",
    icon: AlertCircle,
  },
  incomplete: {
    label: "Incomplete",
    description: "Your subscription setup is incomplete",
    color: "bg-yellow-500",
    textColor: "text-yellow-500",
    icon: AlertCircle,
  },
};
