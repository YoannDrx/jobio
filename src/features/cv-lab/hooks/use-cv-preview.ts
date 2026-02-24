"use client";

import { useEffect, useState } from "react";
import { renderCvLabHtml } from "../cv-renderer";
import {
  resolveCvContent,
  resolveCvContentFromProfile,
} from "../cv-content-resolver";
import type { CvDocument, CvProfile, Draft } from "../cv-lab-utils";

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
  socialLinks: unknown;
  experiences: unknown;
  skills: unknown;
  education: unknown;
  projects: unknown;
  languages: unknown;
  certifications: unknown;
};

type UseCvPreviewParams = {
  selectedDocument: CvDocument | null;
  draft: Draft | null;
  masterCv: MasterCvData | null;
  profileById: Map<string, CvProfile>;
};

export function useCvPreview(params: UseCvPreviewParams) {
  const { selectedDocument, draft, masterCv, profileById } = params;

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Client-side preview rendering
  useEffect(() => {
    if (!selectedDocument || !draft) {
      setPreviewHtml(null);
      setPreviewError(null);
      setIsPreviewLoading(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      try {
        setIsPreviewLoading(true);

        const hasMasterSource =
          typeof selectedDocument.masterCvId === "string" &&
          selectedDocument.masterCvId.length > 0;

        let html: string;

        if (hasMasterSource && masterCv) {
          const content = resolveCvContent(
            masterCv as unknown as Parameters<typeof resolveCvContent>[0],
            {
              contentOverrides: selectedDocument.contentOverrides ?? null,
              hiddenItems: selectedDocument.hiddenItems ?? null,
              personalInfo: selectedDocument.personalInfo ?? null,
            } as Parameters<typeof resolveCvContent>[1],
          );
          html = renderCvLabHtml(
            draft as unknown as Parameters<typeof renderCvLabHtml>[0],
            content,
          );
        } else {
          const profile = profileById.get(draft.profileId);
          if (profile) {
            const content = resolveCvContentFromProfile(
              profile as unknown as Parameters<
                typeof resolveCvContentFromProfile
              >[0],
              {
                contentOverrides: selectedDocument.contentOverrides ?? null,
                hiddenItems: selectedDocument.hiddenItems ?? null,
                personalInfo: selectedDocument.personalInfo ?? null,
              } as Parameters<typeof resolveCvContentFromProfile>[1],
            );
            html = renderCvLabHtml(
              draft as unknown as Parameters<typeof renderCvLabHtml>[0],
              content,
            );
          } else {
            setPreviewError("Profil introuvable");
            setIsPreviewLoading(false);
            return;
          }
        }

        setPreviewHtml(html);
        setPreviewError(null);
      } catch (error) {
        setPreviewError(
          error instanceof Error
            ? error.message
            : "Erreur de rendu de la prévisualisation",
        );
      } finally {
        setIsPreviewLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [draft, selectedDocument, masterCv, profileById]);

  return {
    previewHtml,
    previewError,
    isPreviewLoading,
  };
}
