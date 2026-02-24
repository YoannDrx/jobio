"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  createCvLabVersionAction,
  listCvLabVersionsAction,
  restoreCvLabVersionAction,
} from "../cv-lab.action";
import {
  type CvDocument,
  type CvProfile,
  type CvVersion,
  type Draft,
  type DraftDiffItem,
  type SectionLineDiff,
  CV_LAB_VERSION_COMPARE_CURRENT,
  buildDraftDiffItems,
  buildSectionLineDiffs,
  buildSectionLineSnapshotFromDraft,
  parseDraftFromVersionSnapshot,
  toDate,
} from "../cv-lab-utils";

type UseCvVersionsParams = {
  selectedDocument: CvDocument | null;
  selectedDocumentId: string | null;
  draft: Draft | null;
  profileById: Map<string, CvProfile>;
  setAtsSuggestionPreview: (value: null) => void;
  reloadData: (nextSelectedId?: string | null) => Promise<void>;
};

export function useCvVersions(params: UseCvVersionsParams) {
  const {
    selectedDocument,
    selectedDocumentId,
    draft,
    profileById,
    setAtsSuggestionPreview,
    reloadData,
  } = params;

  const [versions, setVersions] = useState<CvVersion[]>([]);
  const [versionLabel, setVersionLabel] = useState("");
  const [compareLeftVersionId, setCompareLeftVersionId] = useState("");
  const [compareRightReference, setCompareRightReference] = useState(
    CV_LAB_VERSION_COMPARE_CURRENT,
  );

  const refreshVersions = useCallback(async (documentId: string) => {
    const data = await resolveActionResult(
      listCvLabVersionsAction({ documentId, limit: 20 }),
    );
    const mappedVersions = data.map((version) => ({
      id: version.id,
      label: version.label,
      createdAt: version.createdAt,
      snapshot: parseDraftFromVersionSnapshot(version.snapshot),
      snapshotRaw: version.snapshot,
    }));

    setVersions(mappedVersions);
    setCompareLeftVersionId((previous) => {
      if (mappedVersions.some((version) => version.id === previous)) {
        return previous;
      }
      return mappedVersions[0]?.id ?? "";
    });
    setCompareRightReference((previous) => {
      if (previous === CV_LAB_VERSION_COMPARE_CURRENT) {
        return previous;
      }
      if (mappedVersions.some((version) => version.id === previous)) {
        return previous;
      }
      return CV_LAB_VERSION_COMPARE_CURRENT;
    });
  }, []);

  const compareLeftVersion = useMemo(
    () =>
      versions.find((version) => version.id === compareLeftVersionId) ?? null,
    [compareLeftVersionId, versions],
  );

  const compareRightVersion = useMemo(() => {
    if (compareRightReference === CV_LAB_VERSION_COMPARE_CURRENT) {
      return null;
    }
    return (
      versions.find((version) => version.id === compareRightReference) ?? null
    );
  }, [compareRightReference, versions]);

  const compareLeftDraft = compareLeftVersion?.snapshot ?? null;
  const compareRightDraft =
    compareRightReference === CV_LAB_VERSION_COMPARE_CURRENT
      ? draft
      : (compareRightVersion?.snapshot ?? null);

  const versionDiffItems = useMemo(() => {
    if (!compareLeftDraft || !compareRightDraft) {
      return [] as DraftDiffItem[];
    }
    if (
      compareRightReference !== CV_LAB_VERSION_COMPARE_CURRENT &&
      compareLeftVersion?.id === compareRightVersion?.id
    ) {
      return [] as DraftDiffItem[];
    }

    return buildDraftDiffItems(compareLeftDraft, compareRightDraft);
  }, [
    compareLeftDraft,
    compareLeftVersion?.id,
    compareRightDraft,
    compareRightReference,
    compareRightVersion?.id,
  ]);

  const compareLeftSectionLines = useMemo(() => {
    if (!compareLeftVersion || !compareLeftDraft) {
      return null;
    }

    return buildSectionLineSnapshotFromDraft({
      draft: compareLeftDraft,
      profileById,
      versionSnapshotRaw: compareLeftVersion.snapshotRaw,
    });
  }, [compareLeftDraft, compareLeftVersion, profileById]);

  const compareRightSectionLines = useMemo(() => {
    if (!compareRightDraft) {
      return null;
    }

    return buildSectionLineSnapshotFromDraft({
      draft: compareRightDraft,
      profileById,
      versionSnapshotRaw:
        compareRightReference === CV_LAB_VERSION_COMPARE_CURRENT
          ? undefined
          : (compareRightVersion?.snapshotRaw ?? undefined),
    });
  }, [
    compareRightDraft,
    compareRightReference,
    compareRightVersion,
    profileById,
  ]);

  const versionSectionLineDiffs = useMemo(() => {
    if (!compareLeftSectionLines || !compareRightSectionLines) {
      return [] as SectionLineDiff[];
    }

    return buildSectionLineDiffs(
      compareLeftSectionLines,
      compareRightSectionLines,
    );
  }, [compareLeftSectionLines, compareRightSectionLines]);

  const compareLeftLabel = compareLeftVersion
    ? `${compareLeftVersion.label} (${toDate(
        compareLeftVersion.createdAt,
      ).toLocaleString("fr-FR")})`
    : null;

  const compareRightLabel =
    compareRightReference === CV_LAB_VERSION_COMPARE_CURRENT
      ? "Brouillon actuel"
      : compareRightVersion
        ? `${compareRightVersion.label} (${toDate(
            compareRightVersion.createdAt,
          ).toLocaleString("fr-FR")})`
        : null;

  const createVersionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDocument) return;
      await resolveActionResult(
        createCvLabVersionAction({
          documentId: selectedDocument.id,
          label: versionLabel.trim() || undefined,
        }),
      );
    },
    onSuccess: async () => {
      toast.success("Snapshot créé");
      setVersionLabel("");
      if (selectedDocumentId) {
        await refreshVersions(selectedDocumentId);
        await reloadData(selectedDocumentId);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const restoreVersionMutation = useMutation({
    mutationFn: async (versionId: string) => {
      if (!selectedDocument) return;
      await resolveActionResult(
        restoreCvLabVersionAction({
          documentId: selectedDocument.id,
          versionId,
        }),
      );
    },
    onSuccess: async () => {
      toast.success("Version restaurée");
      setAtsSuggestionPreview(null);
      await reloadData(selectedDocumentId);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    versions,
    setVersions,
    versionLabel,
    setVersionLabel,
    compareLeftVersionId,
    setCompareLeftVersionId,
    compareRightReference,
    setCompareRightReference,
    compareLeftDraft,
    compareRightDraft,
    versionDiffItems,
    versionSectionLineDiffs,
    compareLeftLabel,
    compareRightLabel,
    refreshVersions,
    createVersionMutation,
    restoreVersionMutation,
  };
}
