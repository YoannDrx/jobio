import type { MissionStatusValue } from "@/features/missions/mission-status";
import {
  RESPONDED_STATUS_VALUES,
  TERMINAL_MISSION_STATUS_VALUES,
} from "@/features/missions/mission-status";

export type FollowUpPolicyReason =
  | "terminal_mission"
  | "response_received"
  | "do_not_contact"
  | "duplicate_window"
  | "contact_frequency_limit";

const DO_NOT_CONTACT_TAGS = new Set([
  "dnc",
  "do-not-contact",
  "unsubscribed",
  "desinscrit",
  "désinscrit",
  "ne-pas-contacter",
]);
const TERMINAL_STATUSES = new Set<string>(TERMINAL_MISSION_STATUS_VALUES);
const RESPONDED_STATUSES = new Set<string>(RESPONDED_STATUS_VALUES);

const normalizeTag = (tag: string) => tag.trim().toLocaleLowerCase("fr-FR");

export const evaluateFollowUpPolicy = (params: {
  missionStatus: MissionStatusValue;
  isAutomated: boolean;
  contactTags?: string[];
  pendingNearTarget: number;
  recentContactTouches: number;
}): FollowUpPolicyReason | null => {
  if (
    params.contactTags?.some((tag) =>
      DO_NOT_CONTACT_TAGS.has(normalizeTag(tag)),
    )
  ) {
    return "do_not_contact";
  }
  if (TERMINAL_STATUSES.has(params.missionStatus)) {
    return "terminal_mission";
  }
  if (params.isAutomated && RESPONDED_STATUSES.has(params.missionStatus)) {
    return "response_received";
  }
  if (params.pendingNearTarget > 0) return "duplicate_window";
  if (params.recentContactTouches >= 3) return "contact_frequency_limit";
  return null;
};

export const FOLLOW_UP_POLICY_MESSAGES: Record<FollowUpPolicyReason, string> = {
  terminal_mission:
    "Cette mission est terminée. Réouvre-la avant de planifier une relance.",
  response_received:
    "La séquence automatique est arrêtée car une réponse a été enregistrée.",
  do_not_contact: "Ce contact est marqué comme ne devant plus être sollicité.",
  duplicate_window:
    "Une relance est déjà planifiée dans une fenêtre de 24 heures.",
  contact_frequency_limit:
    "Ce contact a déjà été sollicité trois fois sur les sept derniers jours.",
};
