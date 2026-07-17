"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { LoadingButton } from "@/features/form/submit-button";
import { Eye, Pencil, Save, Send, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { EmailPreview } from "./email-preview";
import { toast } from "sonner";
import {
  sendMissionEmailAction,
  saveDraftAction,
  getDraftsAction,
  sendDraftAction,
  deleteDraftAction,
  updateDraftAction,
} from "../send-mission-email.action";
import { renderTemplate } from "@/features/templates/template-renderer";
import { generateEmailAction } from "@/features/ai/generate-email.action";

type Template = {
  id: string;
  name: string;
  type: string;
  subject: string | null;
  body: string;
};

type MissionContext = {
  id: string;
  title: string;
  company: string | null;
  tjm: number | null;
  duration: string | null;
  location: string | null;
  workType: string | null;
  stack: string[];
  contact: {
    firstName: string;
    lastName: string;
    company: string | null;
    email: string | null;
    role: string | null;
  } | null;
};

type Draft = {
  id: string;
  to: string;
  subject: string;
  body: string;
  templateId: string | null;
  createdAt: Date;
};

type SendEmailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mission: MissionContext;
  templates: Template[];
  onSent?: () => void;
};

export function SendEmailDialog({
  open,
  onOpenChange,
  mission,
  templates,
  onSent,
}: SendEmailDialogProps) {
  const [to, setTo] = useState(mission.contact?.email ?? "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [operationId, setOperationId] = useState("");

  const markContentChanged = () => {
    setShowPreview(false);
    setOperationId(crypto.randomUUID());
  };

  const templateContext = {
    mission: {
      title: mission.title,
      company: mission.company,
      tjm: mission.tjm,
      duration: mission.duration,
      location: mission.location,
      workType: mission.workType,
      stack: mission.stack,
    },
    contact: mission.contact
      ? {
          firstName: mission.contact.firstName,
          lastName: mission.contact.lastName,
          company: mission.contact.company,
          role: mission.contact.role,
        }
      : undefined,
  };

  const handleTemplateChange = (templateId: string) => {
    markContentChanged();
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSubject(renderTemplate(template.subject ?? "", templateContext));
      setBody(renderTemplate(template.body, templateContext));
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const selectedTemplate = templates.find(
        (t) => t.id === selectedTemplateId,
      );
      const result = await resolveActionResult(
        generateEmailAction({
          missionId: mission.id,
          templateType: selectedTemplate?.type,
        }),
      );
      setSubject(result.subject);
      setBody(result.body);
      markContentChanged();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur de generation",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const loadDrafts = useCallback(async () => {
    try {
      const result = await resolveActionResult(
        getDraftsAction({ missionId: mission.id }),
      );
      setDrafts(result);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de charger les brouillons",
      );
    }
  }, [mission.id]);

  const handleLoadDraft = (draft: Draft) => {
    setTo(draft.to);
    setSubject(draft.subject);
    setBody(draft.body);
    setSelectedTemplateId(draft.templateId ?? "");
    setActiveDraftId(draft.id);
    setShowPreview(false);
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      if (activeDraftId) {
        await resolveActionResult(
          updateDraftAction({
            id: activeDraftId,
            templateId: selectedTemplateId || null,
            to,
            subject,
            body,
          }),
        );
        toast.success("Brouillon mis à jour");
      } else {
        const draft = await resolveActionResult(
          saveDraftAction({
            missionId: mission.id,
            templateId: selectedTemplateId || undefined,
            to,
            subject,
            body,
          }),
        );
        setActiveDraftId(draft.id);
        toast.success("Brouillon sauvegardé");
      }
      void loadDrafts();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur de sauvegarde",
      );
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSend = async () => {
    if (!showPreview) {
      setShowPreview(true);
      return;
    }

    setIsLoading(true);
    try {
      const timeZone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris";
      if (activeDraftId) {
        await resolveActionResult(
          updateDraftAction({
            id: activeDraftId,
            templateId: selectedTemplateId || null,
            to,
            subject,
            body,
          }),
        );
        await resolveActionResult(
          sendDraftAction({ id: activeDraftId, timeZone }),
        );
      } else {
        await resolveActionResult(
          sendMissionEmailAction({
            missionId: mission.id,
            templateId: selectedTemplateId || undefined,
            operationId: operationId || crypto.randomUUID(),
            timeZone,
            to,
            subject,
            body,
          }),
        );
      }
      toast.success("Email envoyé !");
      onOpenChange(false);
      onSent?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur d'envoi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      await resolveActionResult(deleteDraftAction({ id: draftId }));
      toast.success("Brouillon supprimé");
      if (activeDraftId === draftId) {
        setActiveDraftId(null);
      }
      void loadDrafts();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur de suppression",
      );
    }
  };

  useEffect(() => {
    if (open) {
      setTo(mission.contact?.email ?? "");
      setSubject("");
      setBody("");
      setSelectedTemplateId("");
      setActiveDraftId(null);
      setShowPreview(false);
      setOperationId(crypto.randomUUID());
      void loadDrafts();
    }
  }, [loadDrafts, mission.contact?.email, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Envoyer un email</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {/* Brouillons existants */}
          {drafts.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>Brouillons</Label>
              <div className="flex flex-col gap-1">
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <button
                      type="button"
                      className="text-primary flex-1 truncate text-left hover:underline"
                      onClick={() => handleLoadDraft(draft)}
                    >
                      {draft.subject || "Sans sujet"}
                    </button>
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(draft.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1"
                      onClick={() => void handleDeleteDraft(draft.id)}
                    >
                      <span className="text-destructive text-xs">
                        Supprimer
                      </span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {templates.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>Template</Label>
              <Select
                value={selectedTemplateId}
                onValueChange={handleTemplateChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end">
            <LoadingButton
              variant="outline"
              size="sm"
              loading={isGenerating}
              onClick={handleGenerate}
            >
              <Sparkles className="size-4" />
              Generer avec l'IA
            </LoadingButton>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email-to">Destinataire</Label>
            <Input
              id="email-to"
              type="email"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                markContentChanged();
              }}
              placeholder="email@example.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email-subject">Sujet</Label>
            <Input
              id="email-subject"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                markContentChanged();
              }}
              placeholder="Objet de l'email"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-body">Message</Label>
              <div className="flex rounded-lg border p-0.5">
                <Button
                  variant={!showPreview ? "secondary" : "ghost"}
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setShowPreview(false)}
                >
                  <Pencil className="size-3" />
                  Rédiger
                </Button>
                <Button
                  variant={showPreview ? "secondary" : "ghost"}
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setShowPreview(true)}
                >
                  <Eye className="size-3" />
                  Aperçu
                </Button>
              </div>
            </div>
            {showPreview ? (
              <div className="flex flex-col gap-3 rounded-lg border p-3">
                <dl className="grid gap-2 text-sm">
                  <div className="grid grid-cols-[7rem_1fr] gap-2">
                    <dt className="text-muted-foreground">Destinataire</dt>
                    <dd className="truncate font-medium">{to}</dd>
                  </div>
                  <div className="grid grid-cols-[7rem_1fr] gap-2">
                    <dt className="text-muted-foreground">Sujet</dt>
                    <dd className="font-medium">{subject}</dd>
                  </div>
                </dl>
                <EmailPreview body={body} />
                <p className="text-muted-foreground text-xs">
                  Envoi autorisé les jours ouvrés entre 8 h et 18 h, selon le
                  fuseau horaire de cet appareil.
                </p>
              </div>
            ) : (
              <Textarea
                id="email-body"
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  markContentChanged();
                }}
                placeholder="Contenu de l'email..."
                rows={8}
              />
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <LoadingButton
              variant="outline"
              loading={isSavingDraft}
              onClick={handleSaveDraft}
              disabled={!to || !subject || !body}
            >
              <Save className="size-4" />
              Brouillon
            </LoadingButton>
            <LoadingButton
              loading={isLoading}
              onClick={handleSend}
              disabled={!to || !subject || !body}
            >
              {showPreview ? (
                <Send className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
              {showPreview ? "Envoyer maintenant" : "Vérifier avant envoi"}
            </LoadingButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
