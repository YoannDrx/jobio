import type {
  NormalizedOpportunity,
  OpportunityCriteria,
} from "./opportunities.schema";
import { normalizeOpportunityText } from "./opportunity-normalization";

type ProfileForOpportunityScore = {
  skills: unknown;
  tjmTarget: number | null;
  workTypePreference: string | null;
  zone: string | null;
};

export type OpportunityScore = {
  eligible: boolean;
  score: number;
  breakdown: {
    title: number;
    skills: number;
    locationAndWorkType: number;
    compensation: number;
    freshness: number;
  };
  reasons: string[];
  excludedBy: string | null;
};

const SKILL_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  nodejs: "node.js",
  node: "node.js",
  reactjs: "react",
  nextjs: "next.js",
  postgres: "postgresql",
};

const normalizeSkill = (value: string): string => {
  const normalized = normalizeOpportunityText(value).replace(/\s/g, "");
  return SKILL_ALIASES[normalized] ?? normalized;
};

const LOCATION_STOP_WORDS = new Set(["de", "du", "la", "le", "les"]);
const BROAD_LOCATION_TOKENS = new Set(["france", "europe", "monde", "world"]);
const locationTokens = (value: string): Set<string> =>
  new Set(
    normalizeOpportunityText(value)
      .split(" ")
      .filter(
        (token) =>
          token.length > 1 &&
          !/^\d+$/.test(token) &&
          !LOCATION_STOP_WORDS.has(token),
      ),
  );

const locationsAreCompatible = (target: string, actual: string): boolean => {
  const targetTokens = locationTokens(target);
  const actualTokens = locationTokens(actual);
  if (targetTokens.size === 0 || actualTokens.size === 0) return false;
  const common = [...targetTokens].filter((token) => actualTokens.has(token));
  if (
    common.length > 0 &&
    common.every((token) => BROAD_LOCATION_TOKENS.has(token)) &&
    (targetTokens.size > 1 || actualTokens.size > 1)
  ) {
    return false;
  }
  return common.length / Math.max(targetTokens.size, actualTokens.size) >= 0.5;
};

const profileSkillNames = (skills: unknown): string[] => {
  if (!Array.isArray(skills)) return [];
  return skills.flatMap((skill) => {
    if (typeof skill === "string") return [skill];
    if (
      typeof skill === "object" &&
      skill !== null &&
      "name" in skill &&
      typeof skill.name === "string"
    ) {
      return [skill.name];
    }
    return [];
  });
};

export function scoreOpportunity(
  opportunity: NormalizedOpportunity,
  criteria: OpportunityCriteria,
  profile: ProfileForOpportunityScore | null,
  now = new Date(),
): OpportunityScore {
  const haystack = normalizeOpportunityText(
    [
      opportunity.title,
      opportunity.company,
      opportunity.description,
      opportunity.skills.join(" "),
    ]
      .filter(Boolean)
      .join(" "),
  );
  const excludedBy =
    criteria.excludedKeywords.find((keyword) =>
      haystack.includes(normalizeOpportunityText(keyword)),
    ) ?? null;
  if (excludedBy) {
    return {
      eligible: false,
      score: 0,
      breakdown: {
        title: 0,
        skills: 0,
        locationAndWorkType: 0,
        compensation: 0,
        freshness: 0,
      },
      reasons: [],
      excludedBy,
    };
  }

  const reasons: string[] = [];
  const normalizedTitle = normalizeOpportunityText(opportunity.title);
  const matchingTitles = criteria.titles.filter((title) =>
    normalizedTitle.includes(normalizeOpportunityText(title)),
  );
  const titleScore = matchingTitles.length > 0 ? 20 : 0;
  if (titleScore > 0) reasons.push(`Intitulé aligné : ${matchingTitles[0]}`);

  const expectedSkills = new Set(
    [...criteria.skills, ...profileSkillNames(profile?.skills)].map(
      normalizeSkill,
    ),
  );
  const matchedSkills = opportunity.skills.filter((skill) =>
    expectedSkills.has(normalizeSkill(skill)),
  );
  const skillsScore =
    expectedSkills.size === 0
      ? 20
      : Math.round(
          Math.min(1, matchedSkills.length / Math.min(expectedSkills.size, 8)) *
            40,
        );
  if (matchedSkills.length > 0) {
    reasons.push(
      `Compétences communes : ${matchedSkills.slice(0, 4).join(", ")}`,
    );
  }

  let locationAndWorkType = 0;
  const targetLocation = criteria.location ?? profile?.zone;
  if (targetLocation && opportunity.location) {
    if (locationsAreCompatible(targetLocation, opportunity.location)) {
      locationAndWorkType += 8;
      reasons.push(`Zone compatible : ${opportunity.location}`);
    }
  } else {
    locationAndWorkType += 4;
  }
  const desiredWorkTypes = new Set([
    ...criteria.workTypes,
    ...(profile?.workTypePreference ? [profile.workTypePreference] : []),
  ]);
  if (opportunity.workType && desiredWorkTypes.has(opportunity.workType)) {
    locationAndWorkType += 7;
    reasons.push(`Mode de travail compatible : ${opportunity.workType}`);
  } else if (!opportunity.workType || desiredWorkTypes.size === 0) {
    locationAndWorkType += 3;
  }

  const targetDailyRate = criteria.minDailyRate ?? profile?.tjmTarget;
  let compensation = 5;
  if (targetDailyRate && opportunity.dailyRateMax !== null) {
    const ratio = opportunity.dailyRateMax / targetDailyRate;
    compensation = ratio >= 1 ? 15 : ratio >= 0.8 ? 10 : 0;
    reasons.push(
      ratio >= 1 ? "TJM compatible avec la cible" : "TJM inférieur à la cible",
    );
  } else if (criteria.minSalary && opportunity.salaryMax !== null) {
    compensation = opportunity.salaryMax >= criteria.minSalary ? 15 : 0;
  }

  const referenceDate = opportunity.publishedAt ?? now;
  const ageInDays = Math.max(
    0,
    (now.getTime() - referenceDate.getTime()) / 86_400_000,
  );
  const freshness =
    ageInDays <= 1 ? 10 : ageInDays <= 7 ? 7 : ageInDays <= 30 ? 3 : 0;
  if (freshness >= 7) reasons.push("Annonce récente");

  const breakdown = {
    title: titleScore,
    skills: skillsScore,
    locationAndWorkType: Math.min(15, locationAndWorkType),
    compensation,
    freshness,
  };
  const score = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

  return {
    eligible: titleScore > 0 || skillsScore >= 15,
    score: Math.min(100, score),
    breakdown,
    reasons: reasons.slice(0, 5),
    excludedBy: null,
  };
}
