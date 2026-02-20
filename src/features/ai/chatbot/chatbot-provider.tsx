"use client";

import { useSession } from "@/lib/auth-client";
import { ChatbotBubble } from "./chatbot-bubble";
import { ChatbotWindow } from "./chatbot-window";

export function ChatbotProvider() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <>
      <ChatbotBubble />
      <ChatbotWindow />
    </>
  );
}
