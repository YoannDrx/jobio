"use client";

import dynamic from "next/dynamic";

export const ChatbotLazy = dynamic(
  async () =>
    import("./chatbot-provider").then((mod) => ({
      default: mod.ChatbotProvider,
    })),
  { ssr: false },
);
