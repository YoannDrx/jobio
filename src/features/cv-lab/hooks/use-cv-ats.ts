"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { analyzeCvLabAtsAction } from "../cv-lab.action";
import {
  type AtsAnalysis,
  type AtsSuggestionPreview,
  type Draft,
  type DraftDiffItem,
  type CvDocument,
  buildAtsSuggestionPreview,
  buildDraftDiffItems,
} from "../cv-lab-utils";

type UseCvAtsParams = {
  selectedDocument: CvDocument | null;
  draft: Draft | null;
  setDraft: React.Dispatch<React.SetStateAction<Draft | null>>;
};

export function useCvAts(params: UseCvAtsParams) {
  const { selectedDocument, draft, setDraft } = params;

  const [atsJobDescription, setAtsJobDescription] = useState("");
  const [atsAnalysis, setAtsAnalysis] = useState<AtsAnalysis | null>(null);
  const [atsSuggestionPreview, setAtsSuggestionPreview] =
    useState<AtsSuggestionPreview | null>(null);

  const atsSuggestionDiffItems = useMemo(() => {
    if (!draft || !atsSuggestionPreview) {
      return [] as DraftDiffItem[];
    }

    return buildDraftDiffItems(draft, atsSuggestionPreview.draft);
  }, [atsSuggestionPreview, draft]);

  const atsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDocument || !draft) return null;
      return resolveActionResult(
        analyzeCvLabAtsAction({
          documentId: selectedDocument.id,
          jobDescription: atsJobDescription.trim() || null,
          snapshot: {
            profileId: draft.profileId,
            targetRole: draft.targetRole || null,
            headlineOverride: draft.headlineOverride || null,
            summaryOverride: draft.summaryOverride || null,
            sectionOrder: draft.sectionOrder,
            hiddenSections: draft.hiddenSections,
          },
        }),
      );
    },
    onSuccess: (analysis) => {
      if (!analysis) return;
      setAtsAnalysis(analysis as AtsAnalysis);
      setAtsSuggestionPreview(null);
      toast.success("Analyse ATS generee");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const previewAtsSuggestions = () => {
    if (!draft || !atsAnalysis) {
      return;
    }

    const preview = buildAtsSuggestionPreview({
      draft,
      analysis: atsAnalysis,
      jobDescription: atsJobDescription,
    });

    if (preview.diffItems.length === 0) {
      toast.info("Aucune suggestion ATS actionnable pour le brouillon actuel.");
      setAtsSuggestionPreview(null);
      return;
    }

    setAtsSuggestionPreview(preview);
  };

  const applyAtsSuggestionsToDraft = () => {
    if (!atsSuggestionPreview) {
      return;
    }

    setDraft(atsSuggestionPreview.draft);
    setAtsSuggestionPreview(null);
    toast.success("Suggestions ATS appliquées au brouillon");
  };

  const cancelAtsPreview = () => {
    setAtsSuggestionPreview(null);
  };

  const resetAtsState = useCallback(() => {
    setAtsAnalysis(null);
    setAtsSuggestionPreview(null);
    setAtsJobDescription("");
  }, []);

  return {
    atsJobDescription,
    setAtsJobDescription,
    atsAnalysis,
    setAtsAnalysis,
    atsSuggestionPreview,
    setAtsSuggestionPreview,
    atsSuggestionDiffItems,
    atsMutation,
    previewAtsSuggestions,
    applyAtsSuggestionsToDraft,
    cancelAtsPreview,
    resetAtsState,
  };
}
