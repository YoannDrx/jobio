"use client";

import { Toaster } from "@/components/ui/sonner";
import { ChatbotLazy } from "@/features/ai/chatbot/chatbot-lazy";
import { DialogManagerRenderer } from "@/features/dialog-manager/dialog-manager-renderer";
import { GlobalDialogLazy } from "@/features/global-dialog/global-dialog-lazy";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { PropsWithChildren } from "react";

export function ProductProviders({ children }: PropsWithChildren) {
  return (
    <>
      <Toaster />
      <DialogManagerRenderer />
      <GlobalDialogLazy />
      <ChatbotLazy />
      {children}
      {process.env.NODE_ENV === "development" ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </>
  );
}
