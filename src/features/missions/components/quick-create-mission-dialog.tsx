"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { LoadingButton } from "@/features/form/submit-button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createMissionAction } from "@/features/missions/missions.action";

type QuickCreateMissionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCompany?: string | null;
  contactId?: string;
  onCreated: (mission: { id: string }) => void;
};

export function QuickCreateMissionDialog({
  open,
  onOpenChange,
  defaultCompany,
  contactId,
  onCreated,
}: QuickCreateMissionDialogProps) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState(defaultCompany ?? "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    setIsLoading(true);
    try {
      const mission = await resolveActionResult(
        createMissionAction({
          title: title.trim(),
          company: company.trim() || undefined,
          status: "A_POSTULER",
          contactId: contactId ?? undefined,
        }),
      );
      toast.success("Mission creee");
      onOpenChange(false);
      setTitle("");
      setCompany(defaultCompany ?? "");
      onCreated(mission);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Creer une mission</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="qm-title">Titre</Label>
            <Input
              id="qm-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Developpeur fullstack"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="qm-company">Entreprise</Label>
            <Input
              id="qm-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Corp"
            />
          </div>

          <div className="flex justify-end">
            <LoadingButton loading={isLoading} onClick={handleSubmit}>
              <Plus className="size-4" />
              Creer la mission
            </LoadingButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
