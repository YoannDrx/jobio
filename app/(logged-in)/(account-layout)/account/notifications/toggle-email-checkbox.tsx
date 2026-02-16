"use client";

import { Typography } from "@/components/nowts/typography";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { toggleSubscribedAction } from "./mail-account.action";

type ToggleEmailCheckboxProps = {
  unsubscribed: boolean;
};

export const ToggleEmailCheckbox = ({
  unsubscribed,
}: ToggleEmailCheckboxProps) => {
  const mutation = useMutation({
    mutationFn: async (unsubscribed: boolean) => {
      return resolveActionResult(
        toggleSubscribedAction({
          unsubscribed,
        }),
      );
    },
    onSuccess: () => {
      toast.success("Tes paramètres email ont été mis à jour.");
    },
    onError: () => {
      toast.error("Une erreur est survenue");
    },
  });

  return (
    <div
      className={cn(
        "flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4",
        {
          "bg-muted": mutation.isPending,
        },
      )}
    >
      <Checkbox
        id="unsubscribed-checkbox"
        defaultChecked={unsubscribed}
        disabled={mutation.isPending}
        onCheckedChange={(checked) => {
          const newChecked = Boolean(checked);

          mutation.mutate(newChecked);
        }}
      />
      <div className="space-y-1 leading-none">
        <Label htmlFor="unsubscribed-checkbox">Désabonné</Label>
        <Typography variant="muted">
          Si activé, tu ne recevras plus aucun email marketing ou promotionnel
          de notre part.
        </Typography>
      </div>
    </div>
  );
};
