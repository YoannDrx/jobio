import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

const SECURITY_CREDENTIAL_FIELDS = new Set([
  "accessToken",
  "addressToken",
  "auth",
  "idToken",
  "p256dh",
  "password",
  "refreshToken",
  "shareToken",
  "token",
]);

const accountDataInclude = Prisma.validator<Prisma.UserInclude>()({
  sessions: {
    select: {
      id: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
      ipAddress: true,
      userAgent: true,
      impersonatedBy: true,
    },
  },
  accounts: {
    select: {
      id: true,
      accountId: true,
      providerId: true,
      scope: true,
      createdAt: true,
      updatedAt: true,
      accessTokenExpiresAt: true,
      refreshTokenExpiresAt: true,
    },
  },
  feedbacks: true,
  subscription: true,
  missions: true,
  pipelineSavedViews: true,
  followUps: true,
  activityEvents: true,
  contacts: { include: { interactions: true } },
  contactMergeLogs: true,
  profiles: true,
  userPlatforms: true,
  messageTemplates: true,
  aiUsages: true,
  aiMonthlyQuotas: true,
  aiQuotaAdjustmentsReceived: true,
  notifications: true,
  sentEmails: true,
  sequences: true,
  programPurchases: true,
  targetCompanies: true,
  aiChatThreads: { include: { messages: true } },
  calendarFeedToken: true,
  analyticsSnapshots: true,
  followUpRules: true,
  templateUsages: true,
  linkedInAudits: true,
  pushSubscriptions: true,
  clientPortals: true,
  preference: true,
  aiRecommendations: true,
  dailyStrategies: true,
  opportunityWatches: true,
  opportunityMatches: { include: { listing: true } },
  opportunitySourceRuns: true,
  opportunityInbox: true,
  inboundOpportunityAlerts: true,
  opportunityDigestDeliveries: true,
  userAssets: true,
  cvLabDocuments: true,
  cvLabDocumentVersions: true,
  cvLabCoachSessions: true,
  cvLabCoachMessages: true,
  masterCv: true,
  billingProfile: true,
  billingClients: true,
  billingClientContacts: true,
  billingCatalogItems: true,
  billingNumberingSequences: true,
  billingQuotes: { include: { lines: true } },
  billingQuoteVersions: true,
  billingInvoices: { include: { lines: true, payments: true } },
  billingInvoiceVersions: true,
  billingCreditNotes: true,
  billingPayments: { include: { allocations: true } },
  billingDeclarationPeriods: true,
  billingSocialContributionSnapshots: true,
  billingAuditEvents: true,
  billingExpenseInvoices: true,
  billingExpenseNotes: true,
  billingExpenseTrips: true,
  billingRecurringInvoices: true,
  adminNotesReceived: true,
});

const redactSecurityCredentials = <T>(value: T): T =>
  JSON.parse(
    JSON.stringify(value, (key, nestedValue: unknown) =>
      SECURITY_CREDENTIAL_FIELDS.has(key)
        ? "[REDACTED_SECURITY_CREDENTIAL]"
        : nestedValue,
    ),
  ) as T;

export const exportAccountData = async (userId: string) => {
  const [user, trialIdentity] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: accountDataInclude,
    }),
    prisma.proTrialIdentity.findFirst({
      where: { firstUserId: userId },
    }),
  ]);

  return {
    metadata: {
      schema: "jobio-account-export",
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      securityNotice:
        "Les secrets d'authentification et jetons de partage sont expurgés.",
    },
    data: redactSecurityCredentials({ user, trialIdentity }),
  };
};
