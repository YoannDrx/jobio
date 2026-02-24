"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { generateFollowupMessageAction } from "@/features/ai/generate-followup-message.action";
import { Typography } from "@/components/nowts/typography";

type AIMessageSheetProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  missionId: string;
  followUpType: string;
};

type GeneratedMessage = {
  suggestedSubject: string;
  message: string;
};

export function AIMessageSheet({
  isOpen,
  onOpenChange,
  missionId,
  followUpType,
}: AIMessageSheetProps) {
  const [message, setMessage] = useState<GeneratedMessage | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await resolveActionResult(
        generateFollowupMessageAction({
          missionId,
          followUpType,
        }),
      );
      return result as GeneratedMessage;
    },
    onSuccess: (data) => {
      setMessage(data);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la generation",
      );
    },
  });

  const handleCopyMessage = () => {
    if (message?.message) {
      void navigator.clipboard.writeText(message.message);
      toast.success("Message copie");
    }
  };

  const handleCopySubject = () => {
    if (message?.suggestedSubject) {
      void navigator.clipboard.writeText(message.suggestedSubject);
      toast.success("Objet du message copie");
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open && !message && !mutation.isPending) {
      mutation.mutate();
    }
    if (!open) {
      setMessage(null);
    }
    onOpenChange(open);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="flex flex-col gap-4">
        <SheetHeader>
          <SheetTitle>Message genere par IA</SheetTitle>
        </SheetHeader>

        {mutation.isPending ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="text-muted-foreground size-8 animate-spin" />
            <Typography variant="muted" className="text-sm">
              Generation du message...
            </Typography>
          </div>
        ) : message ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Badge variant="outline" className="w-fit">
                {followUpType === "EMAIL"
                  ? "Email"
                  : followUpType === "CALL"
                    ? "Appel"
                    : followUpType === "MESSAGE"
                      ? "Message"
                      : followUpType === "MEETING"
                        ? "Reunion"
                        : followUpType}
              </Badge>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Typography variant="h3" className="text-sm font-semibold">
                  Objet
                </Typography>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopySubject}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <div className="bg-muted rounded-lg p-3 text-sm">
                {message.suggestedSubject}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Typography variant="h3" className="text-sm font-semibold">
                  Message
                </Typography>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyMessage}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <div className="bg-muted text-muted-foreground max-h-96 overflow-y-auto rounded-lg p-3 text-sm whitespace-pre-wrap">
                {message.message}
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex gap-2 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="flex-1"
          >
            Fermer
          </Button>
          {message && (
            <Button onClick={handleCopyMessage} className="flex-1">
              <Copy className="mr-2 size-4" />
              Copier le message
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
