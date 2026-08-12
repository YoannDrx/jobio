import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getRequiredAdmin } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { UserDetailsCard } from "../../_components/user-details-card";
import {
  getAdminUserAiCreditAdjustments,
  getAdminUserBillingSnapshot,
  getAdminUserBillingTimeline,
  getAdminUserNotes,
} from "../_actions/user-management.action";
import { getAdminAuditLogsForUser } from "@app/admin/_actions/admin-audit";
import { UserActions } from "./_components/user-actions";
import { UserMonitoringCard } from "./_components/user-monitoring-card";
import { UserOperationsCard } from "./_components/user-operations-card";
import { UserProviders } from "./_components/user-providers";
import { UserSessions } from "./_components/user-sessions";

export default async function Page(props: PageProps<"/admin/users/[userId]">) {
  return (
    <Suspense fallback={null}>
      <RoutePage {...props} />
    </Suspense>
  );
}

async function RoutePage(props: PageProps<"/admin/users/[userId]">) {
  const params = await props.params;
  await getRequiredAdmin();

  const userData = await prisma.user.findUnique({
    where: {
      id: params.userId,
    },
    include: {
      accounts: {
        orderBy: {
          createdAt: "desc",
        },
      },
      subscription: true,
    },
  });

  if (!userData) {
    notFound();
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    missionCount,
    contactCount,
    openFollowUps,
    unreadNotifications,
    aiRequestsThisMonth,
    activeSessions,
    latestTimeline,
    aiQuota,
    notes,
    aiCreditAdjustments,
    billingSnapshot,
    billingTimeline,
    recentAdminAudit,
  ] = await Promise.all([
    prisma.mission.count({
      where: {
        userId: userData.id,
        deletedAt: null,
      },
    }),
    prisma.contact.count({
      where: {
        userId: userData.id,
        deletedAt: null,
      },
    }),
    prisma.followUp.count({
      where: {
        userId: userData.id,
        completedAt: null,
      },
    }),
    prisma.notification.count({
      where: {
        userId: userData.id,
        read: false,
      },
    }),
    prisma.aIUsage.count({
      where: {
        userId: userData.id,
        createdAt: {
          gte: startOfMonth,
        },
      },
    }),
    prisma.session.count({
      where: {
        userId: userData.id,
        expiresAt: {
          gt: now,
        },
      },
    }),
    prisma.activityEvent.findMany({
      where: {
        userId: userData.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
      select: {
        id: true,
        type: true,
        description: true,
        createdAt: true,
      },
    }),
    prisma.aIMonthlyQuota.findUnique({
      where: {
        userId_month_year: {
          userId: userData.id,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      },
    }),
    getAdminUserNotes(userData.id, 12),
    getAdminUserAiCreditAdjustments(userData.id, 20),
    getAdminUserBillingSnapshot(userData.id),
    getAdminUserBillingTimeline(userData.id, 80),
    getAdminAuditLogsForUser(userData.id, 16),
  ]);

  const metrics = [
    { label: "Missions", value: missionCount.toString() },
    { label: "Contacts", value: contactCount.toString() },
    { label: "Relances ouvertes", value: openFollowUps.toString() },
    { label: "Notifications non lues", value: unreadNotifications.toString() },
    { label: "Requêtes IA (mois)", value: aiRequestsThisMonth.toString() },
    { label: "Sessions actives", value: activeSessions.toString() },
  ];

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Détails utilisateur</LayoutTitle>
        <LayoutDescription>
          Informations du compte, providers, sessions et actions admin.
        </LayoutDescription>
      </LayoutHeader>
      <LayoutActions>
        <UserActions user={userData} />
      </LayoutActions>

      <LayoutContent className="flex flex-col gap-4">
        <UserDetailsCard user={userData} />
        <UserSessions userId={userData.id} userEmail={userData.email} />
        <UserProviders accounts={userData.accounts} />
        <UserOperationsCard
          userId={userData.id}
          userEmail={userData.email}
          stripeCustomerId={userData.stripeCustomerId ?? null}
          subscription={{
            plan: (userData.subscription?.plan ?? "free") as "free" | "pro",
            status: userData.subscription?.status ?? null,
            cancelAtPeriodEnd:
              userData.subscription?.cancelAtPeriodEnd ?? false,
            periodEnd: userData.subscription?.periodEnd ?? null,
          }}
          aiQuota={
            aiQuota
              ? {
                  month: aiQuota.month,
                  year: aiQuota.year,
                  requestsUsed: aiQuota.requestsUsed,
                  requestsLimit: aiQuota.requestsLimit,
                }
              : null
          }
          stripeSubscriptions={billingSnapshot.stripeSubscriptions.map(
            (subscription) => ({
              id: subscription.id,
              status: subscription.status,
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
              currentPeriodStart: subscription.currentPeriodStart,
              currentPeriodEnd: subscription.currentPeriodEnd,
            }),
          )}
          invoices={billingSnapshot.invoices.map((invoice) => ({
            id: invoice.id,
            status: invoice.status,
            total: invoice.total,
            amountPaid: invoice.amountPaid,
            amountRemaining: invoice.amountRemaining,
            currency: invoice.currency,
            paymentIntentId: invoice.paymentIntentId,
            collectionMethod: invoice.collectionMethod,
            hostedInvoiceUrl: invoice.hostedInvoiceUrl,
            createdAt: invoice.createdAt,
            paidAt: invoice.paidAt,
          }))}
          notes={notes.map((note) => ({
            id: note.id,
            content: note.content,
            createdAt: note.createdAt,
            author: {
              name: note.author.name,
              email: note.author.email,
            },
          }))}
          billingTimeline={billingTimeline.map((item) => ({
            id: item.id,
            source: item.source,
            eventType: item.eventType,
            title: item.title,
            description: item.description,
            occurredAt: item.occurredAt,
            amount: item.amount,
            currency: item.currency,
            status: item.status,
            referenceId: item.referenceId,
          }))}
        />
        <UserMonitoringCard
          metrics={metrics}
          timeline={latestTimeline.map((item) => ({
            id: item.id,
            type: item.type,
            description: item.description,
            createdAt: item.createdAt,
          }))}
          billing={billingSnapshot}
          billingTimeline={billingTimeline.map((item) => ({
            id: item.id,
            source: item.source,
            eventType: item.eventType,
            title: item.title,
            description: item.description,
            occurredAt: item.occurredAt,
            amount: item.amount,
            currency: item.currency,
            status: item.status,
            referenceId: item.referenceId,
          }))}
          aiCreditAdjustments={aiCreditAdjustments.map((item) => ({
            id: item.id,
            month: item.month,
            year: item.year,
            mode: item.mode,
            amount: item.amount,
            previousRequestsLimit: item.previousRequestsLimit,
            nextRequestsLimit: item.nextRequestsLimit,
            previousRequestsUsed: item.previousRequestsUsed,
            nextRequestsUsed: item.nextRequestsUsed,
            reason: item.reason,
            createdAt: item.createdAt,
            actor: {
              name: item.actor.name,
              email: item.actor.email,
            },
          }))}
          auditLogs={recentAdminAudit.map((log) => ({
            id: log.id,
            action: log.action,
            actorEmail: log.actorEmail,
            metadata: log.metadata,
            createdAt: log.createdAt,
          }))}
        />
      </LayoutContent>
    </Layout>
  );
}
