import { generateObject, streamText } from "ai";
import { AI_MODELS } from "@/features/ai/ai-config";
import { checkAndIncrementAIQuota } from "@/features/ai/ai-quota";
import { prisma } from "@/lib/prisma";
import { authRoute } from "@/lib/zod-route";
import { z } from "zod";
import {
  CV_COACH_SYSTEM_PROMPT,
  buildConversationPrompt,
  parseInconsistencies,
  parseMissingItems,
  parseSnapshot,
  toJson,
} from "@/features/cv-lab/cv-coach.utils";
import {
  cvCoachAssistantOutputSchema,
  type CvCoachSnapshot,
} from "@/features/cv-lab/cv-coach.schema";
import { preserveLockedFields } from "@/features/cv-lab/cv-coach-locked-fields";
import { logger } from "@/lib/logger";

export const maxDuration = 60;

const bodySchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().trim().min(1).max(5000),
});

export const POST = authRoute
  .body(bodySchema)
  .handler(async (_req, { body, ctx }) => {
    const user = ctx.user;

    const { checkPlanFeature } = await import("@/lib/plan-limits");
    const hasCvCoach = await checkPlanFeature(user.id, "cvCoachAI");
    if (!hasCvCoach) {
      return new Response(
        "CV Coach IA non disponible avec ton plan actuel. Passe en Ultra pour y accéder.",
        { status: 403 },
      );
    }

    const session = await prisma.cvLabCoachSession.findFirst({
      where: {
        id: body.sessionId,
        userId: user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!session) {
      return new Response("Session introuvable", { status: 404 });
    }

    if (session.archivedAt) {
      return new Response("Session archivée", { status: 400 });
    }

    // Save user message
    await prisma.cvLabCoachMessage.create({
      data: {
        sessionId: session.id,
        userId: user.id,
        role: "USER",
        content: body.message,
      },
    });

    await checkAndIncrementAIQuota(user.id);

    const prompt = buildConversationPrompt({
      userMessage: body.message,
      goalRole: session.goalRole,
      snapshot: parseSnapshot(session.structuredSnapshot),
      missingItems: parseMissingItems(session.missingItems),
      inconsistencies: parseInconsistencies(session.inconsistencies),
      conversationHistory: session.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    // Stream the conversational message
    const result = streamText({
      model: AI_MODELS.smart,
      system: `${
        CV_COACH_SYSTEM_PROMPT
      }\n\nIMPORTANT: Réponds UNIQUEMENT avec le message conversationnel pour l'utilisateur. Utilise le markdown (gras, listes, titres) pour structurer ta réponse. Ne produis PAS de JSON dans cette réponse.`,
      prompt,
      temperature: 0.3,
      onFinish: async ({ text }) => {
        if (!text) return;

        // Save assistant message
        await prisma.cvLabCoachMessage.create({
          data: {
            sessionId: session.id,
            userId: user.id,
            role: "ASSISTANT",
            content: text,
          },
        });

        // Background: generate structured extraction
        try {
          const structuredResponse = await generateObject({
            model: AI_MODELS.smart,
            system: CV_COACH_SYSTEM_PROMPT,
            prompt: `${prompt}\n\n## Réponse assistant déjà envoyée\n${text}`,
            schema: cvCoachAssistantOutputSchema,
            temperature: 0.3,
          });

          const obj = structuredResponse.object;
          const targetRole = obj.snapshot.identity.targetRole.trim();
          const generatedName = obj.sessionName?.trim();

          // Parse locked fields and current snapshot for preservation
          const lockedFields = Array.isArray(session.lockedFields)
            ? (session.lockedFields as string[])
            : [];
          const currentSnapshot = parseSnapshot(session.structuredSnapshot);

          // Preserve locked fields from current snapshot
          const mergedSnapshot =
            lockedFields.length > 0
              ? preserveLockedFields(
                  currentSnapshot,
                  obj.snapshot as CvCoachSnapshot,
                  lockedFields,
                )
              : obj.snapshot;

          await prisma.cvLabCoachSession.update({
            where: { id: session.id },
            data: {
              name:
                generatedName && generatedName.length > 0
                  ? generatedName
                  : session.name,
              goalRole:
                session.goalRole ?? (targetRole.length > 0 ? targetRole : null),
              structuredSnapshot: toJson(mergedSnapshot),
              missingItems: toJson(obj.missingItems),
              inconsistencies: toJson(obj.inconsistencies),
              nextQuestions: toJson(obj.nextQuestions),
              completenessScore: obj.completenessScore,
              sourceEvidence: toJson(obj.sourceEvidence),
              lastExtractedAt: new Date(),
              status:
                obj.completenessScore >= 90 ? "COMPLETED" : session.status,
            },
          });

          await prisma.aIUsage.create({
            data: {
              userId: user.id,
              feature: "CV_COACH",
              inputTokens: structuredResponse.usage.inputTokens ?? 0,
              outputTokens: structuredResponse.usage.outputTokens ?? 0,
            },
          });
        } catch (err) {
          logger.error("[cv-coach] structured extraction failed:", err);
        }
      },
    });

    return result.toTextStreamResponse();
  });
