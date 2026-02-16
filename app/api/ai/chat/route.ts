import {
  convertToModelMessages,
  streamText,
  stepCountIs,
  type UIMessage,
} from "ai";
import { AI_MODELS } from "@/features/ai/ai-config";
import { createChatTools } from "@/features/ai/chat/chat-tools";
import { checkAndIncrementAIQuota } from "@/features/ai/ai-quota";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";

export const maxDuration = 30;

const SYSTEM_PROMPT = `Tu es un assistant IA integre a Jobio, une application de gestion de pipeline freelance.

Tu aides l'utilisateur a :
- Comprendre l'etat de son pipeline de missions (candidatures, entretiens, propositions)
- Retrouver des informations sur ses missions, contacts et follow-ups
- Donner des conseils strategiques pour sa recherche de missions freelance
- Analyser ses statistiques et identifier les actions prioritaires

Regles :
- Reponds toujours en francais
- Sois concis et actionnable
- Utilise les tools disponibles pour acceder aux donnees reelles de l'utilisateur
- Ne fabrique jamais de donnees, utilise toujours les tools pour obtenir les informations
- Quand tu listes des missions, formate-les clairement avec le titre, l'entreprise et le statut`;

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

  await checkAndIncrementAIQuota(user.id);

  const resolvedThreadId = thread.id;

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
    stopWhen: stepCountIs(5),
    onFinish: async ({ text }) => {
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
    },
  });

  return result.toUIMessageStreamResponse();
}
