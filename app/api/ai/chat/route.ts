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

export async function POST(req: Request) {
  const user = await getRequiredUser();

  await checkAndIncrementAIQuota(user.id);

  const {
    messages,
    threadId,
  }: { messages: UIMessage[]; threadId: string | null } = await req.json();

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
        title: "Nouvelle conversation",
      },
    });
  }

  const resolvedThreadId = thread.id;

  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role === "user") {
    const textPart = lastMessage.parts.find((p) => p.type === "text");
    if (textPart && "text" in textPart) {
      await prisma.aIChatMessage.create({
        data: {
          threadId: resolvedThreadId,
          role: "USER",
          content: textPart.text,
        },
      });
    }
  }

  const tools = createChatTools(user.id);

  const result = streamText({
    model: AI_MODELS.fast,
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
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

        const isDefaultTitle = thread.title === "Nouvelle conversation";
        if (isDefaultTitle && text.length > 0) {
          const preview = text.slice(0, 60).replace(/\n/g, " ");
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
