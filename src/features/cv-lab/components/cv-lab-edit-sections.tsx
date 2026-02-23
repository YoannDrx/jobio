"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  MASTER_CV_SECTIONS,
  type CvLabSection,
  type ContentOverrideItem,
  type MasterCvItem,
  type MasterCvSection,
} from "../cv-lab.schema";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import { CvItemSelector } from "./cv-item-selector";

const SECTION_LABELS: Record<CvLabSection, string> = {
  summary: "Resume",
  experiences: "Experiences",
  skills: "Competences",
  projects: "Projets",
  education: "Formation",
  languages: "Langues",
  certifications: "Certifications",
};

type MasterItemsMap = Partial<Record<MasterCvSection, MasterCvItem[]>>;
type HiddenItemsMap = Partial<Record<MasterCvSection, string[]>>;
type ContentOverridesMap = Partial<
  Record<MasterCvSection, ContentOverrideItem[]>
>;

type CvLabEditSectionsProps = {
  sectionOrder: CvLabSection[];
  hiddenSections: CvLabSection[];
  onToggleSection: (section: CvLabSection, visible: boolean) => void;
  onMoveSection: (section: CvLabSection, direction: "up" | "down") => void;
  masterItems?: MasterItemsMap;
  hiddenItemIds?: HiddenItemsMap;
  contentOverrides?: ContentOverridesMap;
  onToggleItem?: (
    section: MasterCvSection,
    itemId: string,
    visible: boolean,
  ) => void;
  onUpdateOverride?: (
    section: MasterCvSection,
    itemId: string,
    patch: Record<string, unknown>,
  ) => void;
  onRemoveOverride?: (section: MasterCvSection, itemId: string) => void;
};

const isMasterCvSection = (section: string): section is MasterCvSection =>
  (MASTER_CV_SECTIONS as readonly string[]).includes(section);

export function CvLabEditSections({
  sectionOrder,
  hiddenSections,
  onToggleSection,
  onMoveSection,
  masterItems,
  hiddenItemIds,
  contentOverrides,
  onToggleItem,
  onUpdateOverride,
  onRemoveOverride,
}: CvLabEditSectionsProps) {
  const [expandedSection, setExpandedSection] =
    useState<MasterCvSection | null>(null);

  const hasMasterCvSupport = Boolean(masterItems && onToggleItem);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    if (result.destination.index === result.source.index) {
      return;
    }

    const section = result.draggableId as CvLabSection;
    const direction =
      result.destination.index > result.source.index ? "down" : "up";
    const moveCount = Math.abs(result.destination.index - result.source.index);

    for (let index = 0; index < moveCount; index += 1) {
      onMoveSection(section, direction);
    }
  };

  if (expandedSection && hasMasterCvSupport) {
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
          onClick={() => setExpandedSection(null)}
        >
          <ArrowLeft className="size-4" />
          Retour aux sections
        </button>
        <h4 className="text-sm font-medium">
          {SECTION_LABELS[expandedSection as CvLabSection]}
        </h4>
        <CvItemSelector
          section={expandedSection}
          masterItems={masterItems?.[expandedSection] ?? []}
          hiddenItemIds={hiddenItemIds?.[expandedSection] ?? []}
          overrides={contentOverrides?.[expandedSection] ?? []}
          onToggleItem={(itemId, visible) =>
            onToggleItem?.(expandedSection, itemId, visible)
          }
          onUpdateOverride={(itemId, patch) =>
            onUpdateOverride?.(expandedSection, itemId, patch)
          }
          onRemoveOverride={(itemId) =>
            onRemoveOverride?.(expandedSection, itemId)
          }
        />
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="cv-section-order">
        {(droppableProvided) => (
          <div
            ref={droppableProvided.innerRef}
            {...droppableProvided.droppableProps}
            className="flex flex-col gap-2"
          >
            {sectionOrder.map((section, index) => {
              const isHidden = hiddenSections.includes(section);
              const canExpand =
                hasMasterCvSupport && isMasterCvSection(section);
              const itemCount = canExpand
                ? (masterItems?.[section as MasterCvSection]?.length ?? 0)
                : 0;

              return (
                <Draggable key={section} draggableId={section} index={index}>
                  {(draggableProvided) => (
                    <div
                      ref={draggableProvided.innerRef}
                      {...draggableProvided.draggableProps}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          title="Glisser pour reordonner"
                          {...draggableProvided.dragHandleProps}
                        >
                          <GripVertical className="size-4" />
                        </button>
                        <Switch
                          checked={!isHidden}
                          onCheckedChange={(checked) =>
                            onToggleSection(section, checked)
                          }
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {SECTION_LABELS[section]}
                          </span>
                          {canExpand && itemCount > 0 ? (
                            <span className="text-muted-foreground text-xs">
                              ({itemCount})
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {canExpand ? (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            title="Gerer les items"
                            onClick={() =>
                              setExpandedSection(section as MasterCvSection)
                            }
                          >
                            <ChevronRight className="size-4" />
                          </Button>
                        ) : null}
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          disabled={index === 0}
                          onClick={() => onMoveSection(section, "up")}
                        >
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          disabled={index === sectionOrder.length - 1}
                          onClick={() => onMoveSection(section, "down")}
                        >
                          <ArrowDown className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Draggable>
              );
            })}
            {droppableProvided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
