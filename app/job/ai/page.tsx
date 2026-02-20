"use client";

import { openChatbot } from "@/features/ai/chatbot/chatbot-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AIChatPage() {
  const router = useRouter();

  useEffect(() => {
    openChatbot();
    router.replace("/job");
  }, [router]);

  return null;
}
