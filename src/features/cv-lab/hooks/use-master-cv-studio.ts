"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { upfetch } from "@/lib/up-fetch";
import {
  addMasterCvItemAction,
  getMasterCvAction,
  removeMasterCvItemAction,
  updateMasterCvAction,
  updateMasterCvItemAction,
  importMasterCvFromProfileAction,
  createMasterCvAction,
} from "../master-cv.action";
import { importMasterCvFromFileAction } from "../master-cv-import.action";

type MasterCvData = {
  id: string;
  fullName: string;
  headline: string | null;
  summary: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  photoUrl: string | null;
  hobbies: unknown;
  driverLicenses: unknown;
  experiences: unknown;
  skills: unknown;
  education: unknown;
  projects: unknown;
  languages: unknown;
  certifications: unknown;
};

type MasterCvSection =
  | "personal"
  | "experiences"
  | "skills"
  | "education"
  | "projects"
  | "languages"
  | "certifications";

export function useMasterCvStudio() {
  const [masterCv, setMasterCv] = useState<MasterCvData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<MasterCvSection | null>(
    null,
  );
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadMasterCv = async () => {
      setIsLoading(true);
      try {
        const result = await resolveActionResult(getMasterCvAction());
        setMasterCv(result as MasterCvData);
      } catch {
        setMasterCv(null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadMasterCv();
  }, []);

  const refreshPreview = useCallback(async () => {
    if (!masterCv?.id) return;

    setIsPreviewLoading(true);
    try {
      const html = await upfetch(
        `/api/cv-lab/render?masterCvId=${masterCv.id}`,
        {
          method: "GET",
        },
      );
      setPreviewHtml(html as string);
    } catch {
      setPreviewHtml(null);
    } finally {
      setIsPreviewLoading(false);
    }
  }, [masterCv?.id]);

  useEffect(() => {
    void refreshPreview();
  }, [masterCv?.id, refreshPreview]);

  const handleCreate = async () => {
    setIsSaving(true);
    try {
      const result = await resolveActionResult(
        createMasterCvAction({
          fullName: "",
          headline: undefined,
          summary: undefined,
          email: undefined,
          phone: undefined,
          city: undefined,
          photoUrl: undefined,
          hobbies: [],
          driverLicenses: [],
        }),
      );
      setMasterCv(result as MasterCvData);
      toast.success("CV Master cree");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur de creation",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (patch: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      const result = await resolveActionResult(updateMasterCvAction(patch));
      setMasterCv(result as MasterCvData);
      await refreshPreview();
      toast.success("Sauvegarde effectuee");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur de sauvegarde",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddItem = async (
    section: string,
    item: Record<string, unknown>,
  ) => {
    try {
      const result = await resolveActionResult(
        addMasterCvItemAction({ section: section as "experiences", item }),
      );
      setMasterCv(result.masterCv as MasterCvData);
      await refreshPreview();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'ajout",
      );
    }
  };

  const handleUpdateItem = async (
    section: string,
    itemId: string,
    patch: Record<string, unknown>,
  ) => {
    try {
      const result = await resolveActionResult(
        updateMasterCvItemAction({
          section: section as "experiences",
          itemId,
          patch,
        }),
      );
      setMasterCv(result as MasterCvData);
      await refreshPreview();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur de mise a jour",
      );
    }
  };

  const handleRemoveItem = async (section: string, itemId: string) => {
    try {
      const result = await resolveActionResult(
        removeMasterCvItemAction({
          section: section as "experiences",
          itemId,
        }),
      );
      setMasterCv(result as MasterCvData);
      await refreshPreview();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur de suppression",
      );
    }
  };

  const handleImportFromProfile = async () => {
    setIsImporting(true);
    try {
      const { getProfilesAction } = await import(
        "@/features/profiles/profiles.action"
      );
      const profiles = await resolveActionResult(getProfilesAction({}));

      if (profiles.length === 0) {
        toast.error("Aucun profil trouve");
        return;
      }

      const defaultProfile =
        profiles.find((p: { isDefault: boolean }) => p.isDefault) ??
        profiles[0];

      const result = await resolveActionResult(
        importMasterCvFromProfileAction({ profileId: defaultProfile.id }),
      );
      setMasterCv(result as MasterCvData);
      await refreshPreview();
      toast.success("Import depuis le profil effectue");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'import",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportFromFile = async (file: File) => {
    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await resolveActionResult(
        importMasterCvFromFileAction({ formData }),
      );
      setMasterCv(result as MasterCvData);
      await refreshPreview();
      toast.success("Import depuis le fichier effectue");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'import",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleSectionClick = useCallback((section: string) => {
    const sectionMap: Record<string, MasterCvSection> = {
      summary: "personal",
      experiences: "experiences",
      skills: "skills",
      projects: "projects",
      education: "education",
      languages: "languages",
      certifications: "certifications",
    };
    setActiveSection(sectionMap[section] ?? null);
    setEditPanelOpen(true);
  }, []);

  return {
    masterCv,
    isLoading,
    isSaving,
    isImporting,
    editPanelOpen,
    setEditPanelOpen,
    activeSection,
    setActiveSection,
    previewHtml,
    isPreviewLoading,
    fileInputRef,
    handleCreate,
    handleUpdate,
    handleAddItem,
    handleUpdateItem,
    handleRemoveItem,
    handleImportFromProfile,
    handleImportFromFile,
    handleSectionClick,
  };
}
