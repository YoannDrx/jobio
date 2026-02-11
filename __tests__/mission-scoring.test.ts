import { scoreMission } from "@/features/missions/mission-scoring";
import type { ScoreBreakdown } from "@/features/missions/mission-scoring";
import { describe, expect, it } from "vitest";

const makeProfile = (overrides = {}) => ({
  skills: [
    { name: "React", level: "expert", yearsExp: 5 },
    { name: "TypeScript", level: "expert", yearsExp: 4 },
    { name: "Node.js", level: "advanced", yearsExp: 3 },
    { name: "PostgreSQL", level: "intermediate", yearsExp: 2 },
    { name: "Docker", level: "intermediate", yearsExp: 1 },
  ],
  tjmTarget: 500,
  workTypePreference: "REMOTE",
  zone: "Paris",
  ...overrides,
});

const makeMission = (overrides = {}) => ({
  stack: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"],
  tjm: 500,
  workType: "REMOTE",
  location: "Paris",
  description: "Full-stack mission",
  company: "Acme Corp",
  duration: "6 mois",
  ...overrides,
});

describe("scoreMission", () => {
  describe("perfect match", () => {
    it("should return ~100 for a perfect match", () => {
      const result = scoreMission(makeMission(), makeProfile());
      expect(result.score).toBe(100);
      expect(result.breakdown.skills.score).toBe(40);
      expect(result.breakdown.tjm.score).toBe(20);
      expect(result.breakdown.workType.score).toBe(15);
      expect(result.breakdown.location.score).toBe(15);
      expect(result.breakdown.completeness.score).toBe(10);
    });
  });

  describe("no match", () => {
    it("should return only completeness score when nothing matches", () => {
      const mission = makeMission({
        stack: ["Java", "Spring"],
        tjm: 100,
        workType: "ON_SITE",
        location: "Lyon",
      });
      const profile = makeProfile({
        skills: [{ name: "React", level: "expert" }],
        tjmTarget: 500,
        workTypePreference: "REMOTE",
        zone: "Paris",
      });
      const result = scoreMission(mission, profile);
      expect(result.breakdown.skills.score).toBe(0);
      expect(result.breakdown.tjm.score).toBe(0);
      expect(result.breakdown.workType.score).toBe(0);
      expect(result.breakdown.location.score).toBe(0);
      expect(result.breakdown.completeness.score).toBe(10);
      expect(result.score).toBe(10);
    });
  });

  describe("skills scoring", () => {
    it("should score proportionally for partial skill match (3/5)", () => {
      const mission = makeMission({
        stack: ["React", "TypeScript", "Node.js", "Python", "Go"],
      });
      const result = scoreMission(mission, makeProfile());
      expect(result.breakdown.skills.score).toBe(24); // 3/5 * 40 = 24
      expect(result.breakdown.skills.matched).toEqual(
        expect.arrayContaining(["React", "TypeScript", "Node.js"]),
      );
      expect(result.breakdown.skills.matched).toHaveLength(3);
    });

    it("should match skills case-insensitively", () => {
      const mission = makeMission({ stack: ["react", "typescript"] });
      const result = scoreMission(mission, makeProfile());
      expect(result.breakdown.skills.score).toBe(40); // 2/2 = 100% * 40
      expect(result.breakdown.skills.matched).toHaveLength(2);
    });

    it("should score 0 when mission has no stack", () => {
      const result = scoreMission(makeMission({ stack: [] }), makeProfile());
      expect(result.breakdown.skills.score).toBe(0);
    });

    it("should score 0 when profile has no skills", () => {
      const result = scoreMission(makeMission(), makeProfile({ skills: [] }));
      expect(result.breakdown.skills.score).toBe(0);
    });
  });

  describe("TJM scoring", () => {
    it("should give full score (20) when TJM is within ±20%", () => {
      const result = scoreMission(
        makeMission({ tjm: 550 }),
        makeProfile({ tjmTarget: 500 }),
      );
      expect(result.breakdown.tjm.score).toBe(20);
    });

    it("should give partial score (10) when TJM is within ±40%", () => {
      const result = scoreMission(
        makeMission({ tjm: 350 }),
        makeProfile({ tjmTarget: 500 }),
      );
      expect(result.breakdown.tjm.score).toBe(10);
    });

    it("should give 0 when TJM is beyond ±40%", () => {
      const result = scoreMission(
        makeMission({ tjm: 200 }),
        makeProfile({ tjmTarget: 500 }),
      );
      expect(result.breakdown.tjm.score).toBe(0);
    });

    it("should handle null mission TJM", () => {
      const result = scoreMission(makeMission({ tjm: null }), makeProfile());
      expect(result.breakdown.tjm.score).toBe(0);
    });

    it("should handle null profile TJM target", () => {
      const result = scoreMission(
        makeMission(),
        makeProfile({ tjmTarget: null }),
      );
      expect(result.breakdown.tjm.score).toBe(0);
    });

    it("should handle TJM = 0", () => {
      const result = scoreMission(
        makeMission({ tjm: 0 }),
        makeProfile({ tjmTarget: 500 }),
      );
      expect(result.breakdown.tjm.score).toBe(0);
    });
  });

  describe("workType scoring", () => {
    it("should give full score (15) for exact match", () => {
      const result = scoreMission(
        makeMission({ workType: "REMOTE" }),
        makeProfile({ workTypePreference: "REMOTE" }),
      );
      expect(result.breakdown.workType.score).toBe(15);
    });

    it("should give partial score (7) when one is HYBRID", () => {
      const result = scoreMission(
        makeMission({ workType: "HYBRID" }),
        makeProfile({ workTypePreference: "REMOTE" }),
      );
      expect(result.breakdown.workType.score).toBe(7);
    });

    it("should give 0 for mismatched non-hybrid types", () => {
      const result = scoreMission(
        makeMission({ workType: "ON_SITE" }),
        makeProfile({ workTypePreference: "REMOTE" }),
      );
      expect(result.breakdown.workType.score).toBe(0);
    });

    it("should handle null workType", () => {
      const result = scoreMission(
        makeMission({ workType: null }),
        makeProfile(),
      );
      expect(result.breakdown.workType.score).toBe(0);
    });

    it("should handle null workType preference", () => {
      const result = scoreMission(
        makeMission(),
        makeProfile({ workTypePreference: null }),
      );
      expect(result.breakdown.workType.score).toBe(0);
    });
  });

  describe("location scoring", () => {
    it("should give full score (15) for matching location", () => {
      const result = scoreMission(
        makeMission({ location: "Paris" }),
        makeProfile({ zone: "Paris" }),
      );
      expect(result.breakdown.location.score).toBe(15);
    });

    it("should match location with includes (case-insensitive)", () => {
      const result = scoreMission(
        makeMission({ location: "Paris, France" }),
        makeProfile({ zone: "paris" }),
      );
      expect(result.breakdown.location.score).toBe(15);
    });

    it("should give 0 for non-matching locations", () => {
      const result = scoreMission(
        makeMission({ location: "Lyon" }),
        makeProfile({ zone: "Paris" }),
      );
      expect(result.breakdown.location.score).toBe(0);
    });

    it("should handle null location", () => {
      const result = scoreMission(
        makeMission({ location: null }),
        makeProfile(),
      );
      expect(result.breakdown.location.score).toBe(0);
    });

    it("should handle null zone", () => {
      const result = scoreMission(makeMission(), makeProfile({ zone: null }));
      expect(result.breakdown.location.score).toBe(0);
    });
  });

  describe("completeness scoring", () => {
    it("should give full score (10) when all fields are present", () => {
      const result = scoreMission(makeMission(), makeProfile());
      expect(result.breakdown.completeness.score).toBe(10);
    });

    it("should give partial score when some fields are missing", () => {
      const result = scoreMission(
        makeMission({
          description: null,
          company: null,
          duration: null,
        }),
        makeProfile(),
      );
      // 2/5 fields present (tjm + workType) = 4
      expect(result.breakdown.completeness.score).toBe(4);
    });

    it("should give 0 when no fields are present", () => {
      const result = scoreMission(
        makeMission({
          description: null,
          company: null,
          duration: null,
          tjm: null,
          workType: null,
        }),
        makeProfile(),
      );
      expect(result.breakdown.completeness.score).toBe(0);
    });
  });

  describe("score capping", () => {
    it("should cap the total score at 100", () => {
      const result = scoreMission(makeMission(), makeProfile());
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe("return type", () => {
    it("should return a valid ScoreBreakdown structure", () => {
      const result: ScoreBreakdown = scoreMission(makeMission(), makeProfile());
      expect(result).toHaveProperty("score");
      expect(result).toHaveProperty("breakdown");
      expect(result.breakdown).toHaveProperty("skills");
      expect(result.breakdown).toHaveProperty("tjm");
      expect(result.breakdown).toHaveProperty("workType");
      expect(result.breakdown).toHaveProperty("location");
      expect(result.breakdown).toHaveProperty("completeness");
      expect(result.breakdown.skills).toHaveProperty("matched");
      expect(Array.isArray(result.breakdown.skills.matched)).toBe(true);
    });
  });
});
