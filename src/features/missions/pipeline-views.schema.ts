import { z } from "zod";

import { MISSION_STATUS_VALUES } from "./mission-status";

const trimmedFilter = z.string().trim().max(100);

export const pipelineSavedViewStateSchema = z.object({
  viewMode: z.enum(["kanban", "list"]),
  search: z.string().trim().max(200),
  sortBy: z.enum(["createdAt", "updatedAt", "tjm", "score", "title"]),
  sortOrder: z.enum(["asc", "desc"]),
  statusFilter: z.array(z.enum(MISSION_STATUS_VALUES)).max(9),
  priorityFilter: z.array(z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"])).max(4),
  platformIdFilter: trimmedFilter,
  tjmMinFilter: z.string().regex(/^\d*$/).max(6),
  tjmMaxFilter: z.string().regex(/^\d*$/).max(6),
  workTypeFilter: z.array(z.enum(["REMOTE", "HYBRID", "ONSITE"])).max(3),
  stackFilter: z.array(trimmedFilter.min(1)).max(20),
  scoreMinFilter: z.string().regex(/^\d*$/).max(3),
  scoreMaxFilter: z.string().regex(/^\d*$/).max(3),
});

export const savePipelineViewSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(50),
  state: pipelineSavedViewStateSchema,
});

export const deletePipelineViewSchema = z.object({
  id: z.string().min(1),
});

export type PipelineSavedViewState = z.infer<
  typeof pipelineSavedViewStateSchema
>;

export type SavedPipelineView = {
  id: string;
  name: string;
  state: PipelineSavedViewState;
};
