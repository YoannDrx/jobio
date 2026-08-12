"use server";

import { authAction, rateLimitedAuthAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { enforcePlanFeature, enforcePlanLimit } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  extractManualOpportunity,
  ingestOpportunityForUser,
  opportunityEmailAddress,
  convertOpportunityMatchToMission,
  statusTimestamps,
  syncOpportunityWatch,
} from "./opportunity-service";
import {
  createOpportunityWatchSchema,
  manualOpportunitySchema,
  opportunityCriteriaSchema,
  updateOpportunityMatchStatusSchema,
  updateOpportunityWatchSchema,
} from "./opportunities.schema";

const refreshOpportunitySurfaces = () => {
  revalidatePath("/job/opportunities");
  revalidatePath("/job");
  revalidatePath("/job/pipeline");
};

export const createOpportunityWatchAction = authAction
  .inputSchema(createOpportunityWatchSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    await enforcePlanFeature(user.id, "opportunityDiscovery");
    const watch = await prisma.opportunityWatch.create({
      data: {
        userId: user.id,
        name: parsedInput.name,
        criteria: parsedInput.criteria,
        sources: parsedInput.sources,
      },
    });
    refreshOpportunitySurfaces();
    return watch;
  });

export const updateOpportunityWatchAction = authAction
  .inputSchema(updateOpportunityWatchSchema)
  .action(async ({ parsedInput: { id, ...input }, ctx: { user } }) => {
    await enforcePlanFeature(user.id, "opportunityDiscovery");
    const watch = await prisma.opportunityWatch.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!watch) throw new ApplicationError("Veille introuvable");
    await prisma.opportunityWatch.update({
      where: { id },
      data: {
        name: input.name,
        criteria: input.criteria,
        sources: input.sources,
        isActive: input.isActive,
      },
    });
    refreshOpportunitySurfaces();
    return { id };
  });

export const deleteOpportunityWatchAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx: { user } }) => {
    await enforcePlanFeature(user.id, "opportunityDiscovery");
    await prisma.opportunityWatch.deleteMany({
      where: { id: parsedInput.id, userId: user.id },
    });
    refreshOpportunitySurfaces();
    return { id: parsedInput.id };
  });

export const syncOpportunityWatchAction = rateLimitedAuthAction(
  "opportunity-watch-sync",
  3,
  300,
)
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx: { user } }) => {
    const result = await syncOpportunityWatch(user.id, parsedInput.id);
    refreshOpportunitySurfaces();
    return result;
  });

export const importManualOpportunityAction = rateLimitedAuthAction(
  "opportunity-manual-import",
  10,
  60,
)
  .inputSchema(manualOpportunitySchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const opportunity = extractManualOpportunity({
      ...parsedInput,
      userId: user.id,
    });
    const profile = await prisma.userProfile.findFirst({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
      select: {
        skills: true,
        tjmTarget: true,
        workTypePreference: true,
        zone: true,
      },
    });
    const criteria = opportunityCriteriaSchema.parse({
      titles: [opportunity.title],
      skills: opportunity.skills,
      workTypes: [],
      excludedKeywords: [],
    });
    const result = await ingestOpportunityForUser({
      userId: user.id,
      opportunity,
      criteria,
      profile,
    });
    refreshOpportunitySurfaces();
    return result;
  });

export const updateOpportunityMatchStatusAction = authAction
  .inputSchema(updateOpportunityMatchStatusSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const match = await prisma.opportunityMatch.findFirst({
      where: { id: parsedInput.id, userId: user.id },
      select: { id: true },
    });
    if (!match) throw new ApplicationError("Opportunité introuvable");
    await prisma.opportunityMatch.update({
      where: { id: match.id },
      data: {
        status: parsedInput.status,
        feedback: parsedInput.feedback,
        ...statusTimestamps(parsedInput.status),
      },
    });
    refreshOpportunitySurfaces();
    return { id: match.id, status: parsedInput.status };
  });

export const convertOpportunityToMissionAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx: { user } }) => {
    await enforcePlanLimit(user.id, "missions");
    const result = await convertOpportunityMatchToMission({
      userId: user.id,
      matchId: parsedInput.id,
    });
    refreshOpportunitySurfaces();
    return {
      missionId: result.id,
      nextSteps: {
        cv: `/job/cv-lab?missionId=${result.id}`,
        message: `/job/emails?missionId=${result.id}`,
        followUp: `/job/follow-ups?missionId=${result.id}`,
      },
    };
  });

export const getOrCreateOpportunityInboxAction = authAction
  .inputSchema(z.object({}))
  .action(async ({ ctx: { user } }) => {
    await enforcePlanFeature(user.id, "opportunityDiscovery");
    const inbox = await prisma.opportunityInbox.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });
    refreshOpportunitySurfaces();
    return {
      address: opportunityEmailAddress(inbox.addressToken),
      isActive: inbox.isActive,
    };
  });

export const updateOpportunityDigestAction = authAction
  .inputSchema(z.object({ enabled: z.boolean() }))
  .action(async ({ parsedInput, ctx: { user } }) => {
    await enforcePlanFeature(user.id, "opportunityDiscovery");
    await prisma.userPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        opportunityDigest: parsedInput.enabled,
      },
      update: { opportunityDigest: parsedInput.enabled },
    });
    refreshOpportunitySurfaces();
    return { enabled: parsedInput.enabled };
  });
