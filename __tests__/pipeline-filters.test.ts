import { describe, it, expect } from "vitest";

// Pure function to test filter where clause construction
const buildFilterWhere = (filters: {
  workType?: string[];
  stack?: string[];
  scoreMin?: number;
  scoreMax?: number;
}) => {
  const where: Record<string, unknown> = {};

  if (filters.workType?.length) {
    where.workType = { in: filters.workType };
  }
  if (filters.stack?.length) {
    where.stack = { hasSome: filters.stack };
  }
  if (filters.scoreMin !== undefined || filters.scoreMax !== undefined) {
    where.score = {};
    if (filters.scoreMin !== undefined)
      (where.score as Record<string, number>).gte = filters.scoreMin;
    if (filters.scoreMax !== undefined)
      (where.score as Record<string, number>).lte = filters.scoreMax;
  }

  return where;
};

describe("pipeline filter where clause", () => {
  it("should filter by workType", () => {
    const result = buildFilterWhere({ workType: ["REMOTE", "HYBRID"] });
    expect(result.workType).toEqual({ in: ["REMOTE", "HYBRID"] });
  });

  it("should filter by stack with hasSome", () => {
    const result = buildFilterWhere({ stack: ["React", "TypeScript"] });
    expect(result.stack).toEqual({ hasSome: ["React", "TypeScript"] });
  });

  it("should filter by score range", () => {
    const result = buildFilterWhere({ scoreMin: 50, scoreMax: 90 });
    expect(result.score).toEqual({ gte: 50, lte: 90 });
  });

  it("should filter by scoreMin only", () => {
    const result = buildFilterWhere({ scoreMin: 60 });
    expect(result.score).toEqual({ gte: 60 });
  });

  it("should filter by scoreMax only", () => {
    const result = buildFilterWhere({ scoreMax: 80 });
    expect(result.score).toEqual({ lte: 80 });
  });

  it("should combine all filters", () => {
    const result = buildFilterWhere({
      workType: ["REMOTE"],
      stack: ["Node.js"],
      scoreMin: 40,
      scoreMax: 100,
    });
    expect(result.workType).toEqual({ in: ["REMOTE"] });
    expect(result.stack).toEqual({ hasSome: ["Node.js"] });
    expect(result.score).toEqual({ gte: 40, lte: 100 });
  });

  it("should return empty where for no filters", () => {
    const result = buildFilterWhere({});
    expect(result).toEqual({});
  });

  it("should ignore empty arrays", () => {
    const result = buildFilterWhere({ workType: [], stack: [] });
    expect(result).toEqual({});
  });
});
