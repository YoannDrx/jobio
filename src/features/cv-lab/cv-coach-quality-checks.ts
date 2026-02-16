import type { CvCoachSnapshot } from "./cv-coach.schema";

export type QualityCheckResult = {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  message: string;
};

const CURRENT_YEAR = 2026;

const parseYear = (dateStr: string): number | null => {
  if (!dateStr || typeof dateStr !== "string") return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/(\d{4})/);
  if (!match) return null;

  return parseInt(match[1], 10);
};

const isValidDateRange = (startDate: string, endDate: string): boolean => {
  const startYear = parseYear(startDate);
  const endYear = parseYear(endDate);

  if (startYear === null || endYear === null) return true;

  return startYear <= endYear;
};

const hasFutureDate = (dateStr: string): boolean => {
  const year = parseYear(dateStr);
  if (year === null) return false;
  return year > CURRENT_YEAR;
};

export function runQualityChecks(
  snapshot: CvCoachSnapshot,
  goalRole?: string,
): QualityCheckResult[] {
  const results: QualityCheckResult[] = [];

  // 1. dates - "Cohérence des dates"
  {
    let hasDateViolation = false;

    for (const exp of snapshot.experiences) {
      if (exp.startDate && exp.endDate) {
        if (!isValidDateRange(exp.startDate, exp.endDate)) {
          hasDateViolation = true;
          break;
        }
      }
      if (exp.startDate && hasFutureDate(exp.startDate)) {
        hasDateViolation = true;
        break;
      }
      if (exp.endDate && hasFutureDate(exp.endDate)) {
        hasDateViolation = true;
        break;
      }
    }

    for (const edu of snapshot.education) {
      if (edu.startDate && edu.endDate) {
        if (!isValidDateRange(edu.startDate, edu.endDate)) {
          hasDateViolation = true;
          break;
        }
      }
      if (edu.startDate && hasFutureDate(edu.startDate)) {
        hasDateViolation = true;
        break;
      }
      if (edu.endDate && hasFutureDate(edu.endDate)) {
        hasDateViolation = true;
        break;
      }
    }

    for (const proj of snapshot.projects) {
      if (proj.startDate && proj.endDate) {
        if (!isValidDateRange(proj.startDate, proj.endDate)) {
          hasDateViolation = true;
          break;
        }
      }
      if (proj.startDate && hasFutureDate(proj.startDate)) {
        hasDateViolation = true;
        break;
      }
      if (proj.endDate && hasFutureDate(proj.endDate)) {
        hasDateViolation = true;
        break;
      }
    }

    results.push({
      id: "dates",
      label: "Cohérence des dates",
      status: hasDateViolation ? "fail" : "pass",
      message: hasDateViolation
        ? "Certaines dates d'expérience sont incohérentes (date de fin antérieure au début ou dates futures)."
        : "Toutes les dates sont cohérentes.",
    });
  }

  // 2. completeness - "Complétude minimale"
  {
    const hasExperience = snapshot.experiences.length >= 1;
    const hasHardSkills = snapshot.skills.hard.length >= 3;
    const hasEducation = snapshot.education.length >= 1;

    let status: "pass" | "warn" | "fail" = "pass";
    let message = "Toutes les sections minimales sont complètes.";

    const missing: string[] = [];
    if (!hasExperience) missing.push("expériences");
    if (!hasHardSkills) missing.push("compétences techniques");
    if (!hasEducation) missing.push("formation");

    if (missing.length === 3) {
      status = "fail";
      message =
        "Sections minimales manquantes : expériences, compétences techniques et formation.";
    } else if (missing.length > 0) {
      status = "warn";
      message = `Sections incomplètes : ${missing.join(", ")}.`;
    }

    results.push({
      id: "completeness",
      label: "Complétude minimale",
      status,
      message,
    });
  }

  // 3. identity - "Informations de contact"
  {
    const hasFullName = snapshot.identity.fullName.trim().length > 0;
    const hasEmail = snapshot.identity.email.trim().length > 0;
    const hasPhone = snapshot.identity.phone.trim().length > 0;

    let status: "pass" | "warn" | "fail" = "pass";
    let message = "Informations de contact complètes.";

    if (!hasFullName) {
      status = "fail";
      message = "Le nom complet est manquant.";
    } else if (!hasEmail || !hasPhone) {
      status = "warn";
      const missing: string[] = [];
      if (!hasEmail) missing.push("email");
      if (!hasPhone) missing.push("téléphone");
      message = `Coordonnées incomplètes : ${missing.join(" et ")} manquant(s).`;
    }

    results.push({
      id: "identity",
      label: "Informations de contact",
      status,
      message,
    });
  }

  // 4. achievements - "Réalisations détaillées"
  {
    let status: "pass" | "warn" | "fail" = "pass";
    let message = "Réalisations bien documentées.";

    if (snapshot.experiences.length === 0) {
      // Skip check if no experiences
    } else {
      const experiencesWithAchievements = snapshot.experiences.filter(
        (exp) => exp.achievements.length > 0,
      ).length;

      const achievementPercentage =
        (experiencesWithAchievements / snapshot.experiences.length) * 100;

      if (achievementPercentage < 50) {
        status = "warn";
        message = `Moins de 50% des expériences ont des réalisations détaillées (${Math.round(achievementPercentage)}%).`;
      }
    }

    results.push({
      id: "achievements",
      label: "Réalisations détaillées",
      status,
      message,
    });
  }

  // 5. summary - "Résumé professionnel"
  {
    const hasSummary = snapshot.summary.trim().length > 0;
    const hasData =
      snapshot.experiences.length > 0 || snapshot.skills.hard.length > 0;

    let status: "pass" | "warn" | "fail" = "pass";
    let message = "Résumé professionnel présent.";

    if (hasData && !hasSummary) {
      status = "warn";
      message =
        "Résumé professionnel vide alors que des données existent (expériences ou compétences).";
    }

    results.push({
      id: "summary",
      label: "Résumé professionnel",
      status,
      message,
    });
  }

  // 6. goalRole - "Rôle cible défini"
  {
    const hasGoalRole = (goalRole?.trim().length ?? 0) > 0;

    results.push({
      id: "goalRole",
      label: "Rôle cible défini",
      status: hasGoalRole ? "pass" : "warn",
      message: hasGoalRole
        ? "Rôle cible défini."
        : "Rôle cible non défini. Cela peut affecter la pertinence de l'analyse.",
    });
  }

  return results;
}
