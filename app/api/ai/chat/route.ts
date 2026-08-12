import {
  convertToModelMessages,
  streamText,
  stepCountIs,
  type UIMessage,
} from "ai";
import { AI_MODELS } from "@/features/ai/ai-config";
import { createChatTools } from "@/features/ai/chat/chat-tools";
import { createAIUsageTracker } from "@/features/ai/ai-usage";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export const maxDuration = 30;

const SYSTEM_PROMPT = `Tu es l'Assistant Jobio, une application complete de gestion d'activite freelance.

Tu es omniscient sur toute l'application et tu aides l'utilisateur dans TOUS les domaines :

## Pipeline & Missions
- Analyser l'etat du pipeline (candidatures, entretiens, propositions, missions acceptees)
- Rechercher des missions par statut, entreprise, stack technique
- Donner le detail d'une mission avec contacts et follow-ups associes
- Evaluer le taux de conversion et la sante du pipeline
- Recommander des actions prioritaires

## Contacts & Entreprises
- Rechercher et consulter les contacts (nom, entreprise, tags)
- Voir l'historique des interactions avec un contact
- Lister les entreprises cibles et leur statut de prospection
- Identifier les contacts a relancer

## Relances & Sequences
- Lister les relances a venir et en retard
- Consulter les sequences de relance configurees
- Acceder aux templates de messages disponibles
- Aider a rediger des messages de relance professionnels

## CV Lab
- Donner une vue d'ensemble du master CV et des documents CV
- Conseiller sur l'optimisation des CV

## Facturation & Freelance
- Consulter les factures (emises, payees, en attente) et devis
- Calculer le CA du mois et les previsions de revenus
- Resumer les frais professionnels (factures fournisseurs, notes de frais, deplacements)
- Informer sur les clients actifs

## Profils & Competences
- Acceder aux profils de l'utilisateur et leurs competences
- Evaluer le positionnement TJM
- Conseiller sur la zone geographique et les preferences

## Analytics & Previsions
- Calculer un score de sante du pipeline
- Estimer les previsions de revenus
- Analyser les taux de conversion

## Calendrier & Planning
- Voir les relances et evenements a venir dans les 7 prochains jours
- Identifier les relances en retard
- Proposer un plan d'action du jour

Regles :
- Reponds toujours en francais
- Sois concis, actionnable et bienveillant
- Utilise les tools disponibles pour acceder aux donnees reelles de l'utilisateur
- Ne fabrique jamais de donnees, utilise toujours les tools pour obtenir les informations
- Quand tu listes des elements, formate-les clairement en markdown
- Les montants en cents doivent etre convertis en euros (diviser par 100) avant affichage
- Quand l'utilisateur demande un plan d'action, combine plusieurs tools pour une reponse complete`;

const DEFAULT_THREAD_TITLE = "Nouvelle conversation";

function extractUserText(message: UIMessage): string {
  const textParts = message.parts.filter(
    (part): part is { type: "text"; text: string } =>
      part.type === "text" && "text" in part && typeof part.text === "string",
  );

  const firstNonEmpty = textParts
    .map((part) => part.text.trim())
    .find((text) => text.length > 0);

  return firstNonEmpty ?? "";
}

function buildThreadPreviewTitle(source: string): string {
  return source.replace(/\s+/g, " ").trim().slice(0, 60);
}

export async function POST(req: Request) {
  const user = await getRequiredUser();
  const rateLimit = await enforceRateLimit({
    key: `ai-chat:${user.id}`,
    limit: 30,
    windowSeconds: 60,
  });

  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error:
          "Trop de requêtes IA en peu de temps. Réessaie dans quelques secondes.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return new Response("Payload invalide", { status: 400 });
  }

  const body = payload as Record<string, unknown>;
  const rawMessages = Array.isArray(body.messages) ? body.messages : [];
  const messages = rawMessages as UIMessage[];
  const threadId = typeof body.threadId === "string" ? body.threadId : null;

  if (messages.length === 0) {
    return new Response("Aucun message fourni", { status: 400 });
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== "user") {
    return new Response("Le dernier message doit provenir de l'utilisateur", {
      status: 400,
    });
  }

  const userPrompt = extractUserText(lastMessage);
  if (!userPrompt) {
    return new Response("Message utilisateur vide", { status: 400 });
  }

  let thread;
  if (threadId) {
    thread = await prisma.aIChatThread.findFirst({
      where: { id: threadId, userId: user.id },
    });
    if (!thread) {
      return new Response("Thread introuvable", { status: 404 });
    }
  } else {
    thread = await prisma.aIChatThread.create({
      data: {
        userId: user.id,
        title: DEFAULT_THREAD_TITLE,
      },
    });
  }

  let usageTracker;
  try {
    usageTracker = await createAIUsageTracker({
      userId: user.id,
      feature: "CHAT",
      modelId: AI_MODELS.fast.modelId,
      context: { surface: "copilot", threadId: thread.id },
    });
  } catch (err) {
    const message =
      err instanceof ApplicationError
        ? err.message
        : "Une erreur est survenue avec le quota IA.";
    return new Response(JSON.stringify({ error: message }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  const resolvedThreadId = thread.id;

  try {
    await prisma.aIChatMessage.create({
      data: {
        threadId: resolvedThreadId,
        role: "USER",
        content: userPrompt,
      },
    });

    const tools = createChatTools(user.id);

    const result = streamText({
      model: AI_MODELS.fast,
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(8),
      onFinish: async ({ text, totalUsage, response }) => {
        try {
          if (text) {
            await prisma.aIChatMessage.create({
              data: {
                threadId: resolvedThreadId,
                role: "ASSISTANT",
                content: text,
              },
            });

            const isDefaultTitle = thread.title === DEFAULT_THREAD_TITLE;
            if (isDefaultTitle) {
              const preview = buildThreadPreviewTitle(userPrompt);
              await prisma.aIChatThread.update({
                where: { id: resolvedThreadId },
                data: { title: preview },
              });
            }
          }
        } finally {
          await usageTracker.succeed(totalUsage, response);
        }
      },
      onError: async ({ error }) => usageTracker.fail(error),
      onAbort: async () => usageTracker.fail(new Error("AI_STREAM_ABORTED")),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    await usageTracker.fail(error);
    throw error;
  }
}
