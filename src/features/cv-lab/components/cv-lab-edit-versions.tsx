"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { History } from "lucide-react";

export const CV_LAB_VERSION_COMPARE_CURRENT = "__current_draft__";

export type DraftDiffItem = {
  id: string;
  label: string;
  before: string;
  after: string;
};

export type SectionLineDiff = {
  sectionId: "summary" | "experiences";
  sectionLabel: string;
  addedLines: string[];
  removedLines: string[];
};

export type CvLabEditVersionsProps = {
  versions: {
    id: string;
    label: string;
    createdAt: string | Date;
  }[];
  versionLabel: string;
  onVersionLabelChange: (value: string) => void;
  onCreateVersion: () => void;
  isCreatingVersion: boolean;
  onRestoreVersion: (versionId: string) => void;
  isRestoringVersion: boolean;
  compareLeftVersionId: string;
  onCompareLeftVersionIdChange: (value: string) => void;
  compareRightReference: string;
  onCompareRightReferenceChange: (value: string) => void;
  compareLeftDraft: unknown;
  compareRightDraft: unknown;
  versionDiffItems: DraftDiffItem[];
  versionSectionLineDiffs: SectionLineDiff[];
  compareLeftLabel: string | null;
  compareRightLabel: string | null;
};

const toDate = (value: string | Date) => new Date(value);

export function CvLabEditVersions({
  versions,
  versionLabel,
  onVersionLabelChange,
  onCreateVersion,
  isCreatingVersion,
  onRestoreVersion,
  isRestoringVersion,
  compareLeftVersionId,
  onCompareLeftVersionIdChange,
  compareRightReference,
  onCompareRightReferenceChange,
  compareLeftDraft,
  compareRightDraft,
  versionDiffItems,
  versionSectionLineDiffs,
  compareLeftLabel,
  compareRightLabel,
}: CvLabEditVersionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Versions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 md:flex-row">
          <Input
            placeholder="Nom du snapshot (optionnel)"
            value={versionLabel}
            onChange={(event) => onVersionLabelChange(event.target.value)}
          />
          <Button
            variant="outline"
            onClick={onCreateVersion}
            disabled={isCreatingVersion}
          >
            <History className="mr-2 size-4" />
            Snapshot
          </Button>
        </div>
        <Separator />
        <div className="flex flex-col gap-2">
          {versions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucune version sauvegardée.
            </p>
          ) : (
            versions.map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{version.label}</p>
                  <p className="text-muted-foreground text-xs">
                    {toDate(version.createdAt).toLocaleString("fr-FR")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      onCompareLeftVersionIdChange(version.id);
                      onCompareRightReferenceChange(
                        CV_LAB_VERSION_COMPARE_CURRENT,
                      );
                    }}
                  >
                    Comparer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRestoreVersion(version.id)}
                    disabled={isRestoringVersion}
                  >
                    Restaurer
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">Comparateur de versions</p>
          {versions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Crée au moins une version pour comparer.
            </p>
          ) : (
            <>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <Label>Version de référence (avant)</Label>
                  <Select
                    value={compareLeftVersionId}
                    onValueChange={onCompareLeftVersionIdChange}
                  >
                    <SelectTrigger
                      className="w-full"
                      data-testid="cv-lab-version-compare-left"
                    >
                      <SelectValue placeholder="Choisir une version" />
                    </SelectTrigger>
                    <SelectContent>
                      {versions.map((version) => (
                        <SelectItem key={version.id} value={version.id}>
                          {version.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <Label>Version cible (après)</Label>
                  <Select
                    value={compareRightReference}
                    onValueChange={onCompareRightReferenceChange}
                  >
                    <SelectTrigger
                      className="w-full"
                      data-testid="cv-lab-version-compare-right"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CV_LAB_VERSION_COMPARE_CURRENT}>
                        Brouillon actuel
                      </SelectItem>
                      {versions.map((version) => (
                        <SelectItem key={version.id} value={version.id}>
                          {version.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!compareLeftDraft || !compareRightDraft ? (
                <p className="text-muted-foreground text-sm">
                  Impossible de comparer ces versions (snapshot incomplet).
                </p>
              ) : versionDiffItems.length === 0 &&
                versionSectionLineDiffs.length === 0 ? (
                <div className="rounded-md border p-3">
                  <p className="text-sm font-medium">
                    Aucune différence détectée
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {compareLeftLabel ?? "Version sélectionnée"} et{" "}
                    {compareRightLabel ?? "cible"} sont identiques.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-muted-foreground text-xs">
                    {versionDiffItems.length + versionSectionLineDiffs.length}{" "}
                    changement(s) entre{" "}
                    {compareLeftLabel ?? "version de référence"} et{" "}
                    {compareRightLabel ?? "version cible"}.
                  </p>
                  {versionDiffItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-md border p-3"
                      data-testid={`cv-lab-version-diff-${item.id}`}
                    >
                      <p className="text-sm font-medium">{item.label}</p>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        <div className="rounded-md border bg-amber-50 p-2">
                          <p className="text-[11px] font-medium text-amber-800 uppercase">
                            Avant
                          </p>
                          <p className="mt-1 text-xs text-amber-900">
                            {item.before}
                          </p>
                        </div>
                        <div className="rounded-md border bg-emerald-50 p-2">
                          <p className="text-[11px] font-medium text-emerald-800 uppercase">
                            Après
                          </p>
                          <p className="mt-1 text-xs text-emerald-900">
                            {item.after}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {versionSectionLineDiffs.length > 0 ? (
                    <div className="flex flex-col gap-2 pt-2">
                      <p className="text-xs font-medium uppercase">
                        Diff par section (lignes)
                      </p>
                      {versionSectionLineDiffs.map((sectionDiff) => (
                        <div
                          key={sectionDiff.sectionId}
                          className="rounded-md border p-3"
                          data-testid={`cv-lab-version-section-diff-${sectionDiff.sectionId}`}
                        >
                          <p className="text-sm font-medium">
                            {sectionDiff.sectionLabel}
                          </p>
                          <div className="mt-2 grid gap-2 md:grid-cols-2">
                            <div className="rounded-md border bg-rose-50 p-2">
                              <p className="text-[11px] font-medium text-rose-800 uppercase">
                                Lignes supprimées
                              </p>
                              {sectionDiff.removedLines.length === 0 ? (
                                <p className="mt-1 text-xs text-rose-900">
                                  Aucune
                                </p>
                              ) : (
                                <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-rose-900">
                                  {sectionDiff.removedLines.map((line) => (
                                    <li key={line}>{line}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <div className="rounded-md border bg-emerald-50 p-2">
                              <p className="text-[11px] font-medium text-emerald-800 uppercase">
                                Lignes ajoutées
                              </p>
                              {sectionDiff.addedLines.length === 0 ? (
                                <p className="mt-1 text-xs text-emerald-900">
                                  Aucune
                                </p>
                              ) : (
                                <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-emerald-900">
                                  {sectionDiff.addedLines.map((line) => (
                                    <li key={line}>{line}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
