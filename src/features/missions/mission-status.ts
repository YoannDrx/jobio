export const MISSION_STATUS_VALUES = [
  "A_POSTULER",
  "POSTULE",
  "ENTRETIEN",
  "PROPOSITION",
  "ACCEPTE",
  "REFUSE",
  "EN_PAUSE",
  "ABANDONNE",
  "ARCHIVE",
] as const;

export type MissionStatusValue = (typeof MISSION_STATUS_VALUES)[number];

export const MISSION_STATUS_LABELS: Record<MissionStatusValue, string> = {
  A_POSTULER: "À postuler",
  POSTULE: "Postulé",
  ENTRETIEN: "Entretien",
  PROPOSITION: "Proposition",
  ACCEPTE: "Accepté",
  REFUSE: "Refusé",
  EN_PAUSE: "En pause",
  ABANDONNE: "Abandonné",
  ARCHIVE: "Archivé",
};

export const PIPELINE_STATUS_VALUES = [
  "A_POSTULER",
  "POSTULE",
  "ENTRETIEN",
  "PROPOSITION",
  "EN_PAUSE",
  "ACCEPTE",
  "REFUSE",
  "ABANDONNE",
] as const;

export const KANBAN_STATUS_VALUES = [...PIPELINE_STATUS_VALUES] as const;

export const TODAY_SUMMARY_STATUS_VALUES = [...PIPELINE_STATUS_VALUES] as const;

export const TERMINAL_MISSION_STATUS_VALUES = [
  "ACCEPTE",
  "REFUSE",
  "ABANDONNE",
  "ARCHIVE",
] as const;

export const STALE_ELIGIBLE_STATUS_VALUES = [
  "A_POSTULER",
  "POSTULE",
  "ENTRETIEN",
  "PROPOSITION",
  "EN_PAUSE",
] as const;

export const FOLLOW_UP_RECOMMENDED_STATUS_VALUES = [
  "POSTULE",
  "ENTRETIEN",
  "PROPOSITION",
] as const;

export const RESPONDED_STATUS_VALUES = [
  "ENTRETIEN",
  "PROPOSITION",
  "ACCEPTE",
] as const;
