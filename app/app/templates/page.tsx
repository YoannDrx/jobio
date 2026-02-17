"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/nowts/empty-state";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  createTemplateAction,
  deleteTemplateAction,
  duplicateTemplateAction,
  getTemplatesAction,
  updateTemplateAction,
} from "@/features/templates/templates.action";
import { TemplateForm } from "@/features/templates/components/template-form";
import { TemplateList } from "@/features/templates/components/template-list";
import { TemplatePreview } from "@/features/templates/components/template-preview";
import type { CreateTemplateInput } from "@/features/templates/templates.schema";
import { FileText, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Template = {
  id: string;
  name: string;
  type: string;
  subject: string | null;
  body: string;
  variables: string[];
  isSystem: boolean;
};

type EditingTemplate = Template | null;

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog create/edit
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EditingTemplate>(null);

  // Sheet preview
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      const result = await resolveActionResult(getTemplatesAction({}));
      setTemplates(result);
    } catch {
      toast.error("Erreur lors du chargement des templates");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  const handleCreate = async (data: CreateTemplateInput) => {
    await resolveActionResult(createTemplateAction(data));
    toast.success("Template cree avec succes");
    setShowForm(false);
    void fetchTemplates();
  };

  const handleUpdate = async (data: CreateTemplateInput) => {
    if (!editing) return;
    await resolveActionResult(
      updateTemplateAction({
        id: editing.id,
        ...data,
      }),
    );
    toast.success("Template mis a jour");
    setShowForm(false);
    setEditing(null);
    void fetchTemplates();
  };

  const handleDelete = async (template: Template) => {
    if (template.isSystem) return;
    try {
      await resolveActionResult(deleteTemplateAction({ id: template.id }));
      toast.success("Template supprime");
      void fetchTemplates();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la suppression",
      );
    }
  };

  const handleEdit = (template: Template) => {
    if (template.isSystem) return;
    setEditing(template);
    setShowForm(true);
  };

  const handlePreview = (template: Template) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const handleDuplicate = async (template: Template) => {
    try {
      await resolveActionResult(duplicateTemplateAction({ id: template.id }));
      toast.success("Template duplique");
      void fetchTemplates();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la duplication",
      );
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Templates</LayoutTitle>
      </LayoutHeader>
      <LayoutActions>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          <Plus className="size-4" />
          Nouveau template
        </Button>
      </LayoutActions>

      <LayoutContent>
        {isLoading ? (
          <div className="text-muted-foreground py-12 text-center text-sm">
            Chargement...
          </div>
        ) : templates.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aucun template"
            description="Crée ton premier template de message pour gagner du temps."
            action={{
              label: "Creer un template",
              onClick: () => setShowForm(true),
            }}
          />
        ) : (
          <TemplateList
            templates={templates}
            onEdit={handleEdit}
            onDelete={(template) => void handleDelete(template)}
            onPreview={handlePreview}
            onDuplicate={(template) => void handleDuplicate(template)}
          />
        )}
      </LayoutContent>

      {/* Create/Edit dialog */}
      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier le template" : "Nouveau template"}
            </DialogTitle>
          </DialogHeader>
          <TemplateForm
            key={editing?.id ?? "new"}
            defaultValues={
              editing
                ? {
                    name: editing.name,
                    type: editing.type as CreateTemplateInput["type"],
                    subject: editing.subject ?? undefined,
                    body: editing.body,
                    variables: editing.variables,
                  }
                : undefined
            }
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={handleCloseForm}
            submitLabel={editing ? "Modifier" : "Creer le template"}
          />
        </DialogContent>
      </Dialog>

      {/* Preview sheet */}
      <Sheet open={showPreview} onOpenChange={setShowPreview}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {previewTemplate?.name ?? "Apercu du template"}
            </SheetTitle>
          </SheetHeader>
          {previewTemplate && (
            <div className="p-4">
              <TemplatePreview
                template={{
                  name: previewTemplate.name,
                  body: previewTemplate.body,
                  variables: previewTemplate.variables,
                }}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </Layout>
  );
}
