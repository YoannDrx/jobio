import { describe, expect, it } from "vitest";

import {
  pipelineSavedViewStateSchema,
  savePipelineViewSchema,
} from "../src/features/missions/pipeline-views.schema";

const validState = {
  viewMode: "kanban",
  search: "Next.js",
  sortBy: "updatedAt",
  sortOrder: "desc",
  statusFilter: ["POSTULE"],
  priorityFilter: ["HIGH"],
  platformIdFilter: "platform-1",
  tjmMinFilter: "500",
  tjmMaxFilter: "900",
  workTypeFilter: ["REMOTE"],
  stackFilter: ["TypeScript"],
  scoreMinFilter: "60",
  scoreMaxFilter: "100",
} as const;

describe("pipeline saved view schema", () => {
  it("accepts a complete URL-compatible pipeline state", () => {
    expect(pipelineSavedViewStateSchema.parse(validState)).toEqual(validState);
  });

  it("trims the name and rejects unbounded or unknown filters", () => {
    expect(
      savePipelineViewSchema.parse({
        name: "  Missions chaudes  ",
        state: validState,
      }).name,
    ).toBe("Missions chaudes");

    expect(() =>
      pipelineSavedViewStateSchema.parse({
        ...validState,
        statusFilter: ["NOT_A_STATUS"],
      }),
    ).toThrow();
    expect(() =>
      pipelineSavedViewStateSchema.parse({
        ...validState,
        stackFilter: Array.from({ length: 21 }, (_, index) => `tag-${index}`),
      }),
    ).toThrow();
  });
});
