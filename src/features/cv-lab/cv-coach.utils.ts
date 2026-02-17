import type { Prisma } from "@/generated/prisma";
import {
  cvCoachInconsistencySchema,
  cvCoachMissingItemSchema,
  cvCoachSnapshotSchema,
  cvCoachSourceEvidenceItemSchema,
  type CvCoachInconsistency,
  type CvCoachMissingItem,
  type CvCoachSnapshot,
  type CvCoachSourceEvidenceItem,
} from "./cv-coach.schema";

export const CV_COACH_SYSTEM_PROMPT = `Tu es le CV Coach IA de Jobio, un expert bienveillant en création de CV premium.

Ton role:
- Transformer une conversation libre en dossier CV structuré et exploitable.
- Détecter les informations manquantes et poser les bonnes questions.
- Signaler les incohérences (dates contradictoires, rôles flous, gaps inexpliqués).
- Valoriser chaque parcours, y compris les profils atypiques (reconversions, parcours créatifs vers tech, etc.).

Style de communication:
- Empathique et encourageant, comme un vrai coach premium.
- Direct et concis : pas de blabla, chaque phrase apporte de la valeur.
- Utilise le markdown (gras, listes, titres) pour structurer tes réponses.
- Pose des questions de relance précises pour obtenir des détails concrets.
- Valorise ce que le candidat a déjà partagé avant de demander plus.

Qualité des questions:
- Priorité aux dates exactes, impacts chiffrables (KPIs, volumes, gains), rôle précis, contexte équipe/stack, niveau de responsabilité.
- Questions de précision : "Tu mentionnes avoir géré une équipe, combien de personnes ? Quel était ton rôle exact ?"
- Détection des compétences implicites : "gérer une équipe" → leadership, management. "Migrer un système" → architecture, gestion du changement.
- Max 4 questions à la fois, ordonnées par impact CV.

Détection de compétences:
- Extrais les compétences même quand elles ne sont pas explicitement nommées.
- Distingue hard skills, soft skills et outils/technologies.
- Si le candidat mentionne un contexte (startup, grand groupe, freelance), déduis les soft skills associées.

Définition de la complétion:
- 0-30: beaucoup d'informations manquantes, début de conversation.
- 31-60: base exploitable mais incomplet, besoin de détails.
- 61-80: bon niveau pour un CV v1, quelques précisions à apporter.
- 81-100: quasi prêt à exporter, très peu de manques.

Niveaux de confiance par champ (confidence):
- HIGH : information explicitement confirmée avec détails précis (ex: "j'ai géré une équipe de 5 personnes pendant 2 ans")
- MEDIUM : information déduite ou partiellement confirmée (ex: mentionné dans le contexte mais sans détail)
- LOW : information supposée, à confirmer (ex: "je faisais du management" sans précision)
- Ajoute le champ "confidence" dans chaque experience, education, certification et projet extrait.

Source evidence (preuves de source):
- Pour chaque champ mis à jour dans le snapshot, renseigne sourceEvidence avec :
  - fieldPath : le chemin du champ (ex: "experiences.0.title", "identity.fullName")
  - messageIndex : l'index du message source dans la conversation (0 = premier message)
  - excerpt : un extrait pertinent du message source (max 100 caractères)
  - confidence : le niveau de confiance (HIGH, MEDIUM, LOW)
- Cela permet de tracer la provenance de chaque information et d'offrir transparence à l'utilisateur.

Tu dois retourner uniquement l'objet JSON valide selon le schema fourni.`;

export const createEmptySnapshot = (): CvCoachSnapshot =>
  cvCoachSnapshotSchema.parse({
    identity: {
      fullName: "",
      headline: "",
      targetRole: "",
      location: "",
      email: "",
      phone: "",
      website: "",
      linkedinUrl: "",
    },
    summary: "",
    experiences: [],
    education: [],
    certifications: [],
    languages: [],
    projects: [],
    skills: {
      hard: [],
      soft: [],
      tools: [],
    },
    achievements: [],
    interests: [],
    constraints: {
      availability: "",
      tjmTarget: "",
      salaryTarget: "",
      contractType: "",
      workMode: "",
      mobility: "",
    },
  });

export const parseSnapshot = (value: unknown): CvCoachSnapshot => {
  const parsed = cvCoachSnapshotSchema.safeParse(value);
  if (!parsed.success) {
    return createEmptySnapshot();
  }
  return parsed.data;
};

export const parseMissingItems = (value: unknown): CvCoachMissingItem[] => {
  const parsed = cvCoachMissingItemSchema.array().safeParse(value);
  if (!parsed.success) {
    return [];
  }
  return parsed.data;
};

export const parseInconsistencies = (
  value: unknown,
): CvCoachInconsistency[] => {
  const parsed = cvCoachInconsistencySchema.array().safeParse(value);
  if (!parsed.success) {
    return [];
  }
  return parsed.data;
};

export const parseNextQuestions = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 6);
};

export const parseSourceEvidence = (
  value: unknown,
): CvCoachSourceEvidenceItem[] => {
  const parsed = cvCoachSourceEvidenceItemSchema.array().safeParse(value);
  if (!parsed.success) {
    return [];
  }
  return parsed.data;
};

export const parseLockedFields = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string => typeof item === "string")
    .slice(0, 500);
};

export const toJson = (value: unknown): Prisma.InputJsonValue =>
  value as Prisma.InputJsonValue;

export const buildConversationPrompt = (params: {
  userMessage: string;
  goalRole: string | null;
  snapshot: CvCoachSnapshot;
  missingItems: CvCoachMissingItem[];
  inconsistencies: CvCoachInconsistency[];
  conversationHistory: { role: "USER" | "ASSISTANT"; content: string }[];
}) => {
  const history = params.conversationHistory
    .slice(-14)
    .map(
      (item) =>
        `${item.role === "USER" ? "Utilisateur" : "Coach"}: ${item.content}`,
    )
    .join("\n");
  const goalRole = params.goalRole?.trim();

  return [
    "## Objectif poste (si defini)",
    goalRole && goalRole.length > 0 ? goalRole : "non defini",
    "",
    "## Snapshot structure courant (JSON)",
    JSON.stringify(params.snapshot),
    "",
    "## Donnees manquantes (JSON)",
    JSON.stringify(params.missingItems),
    "",
    "## Incoherences detectees (JSON)",
    JSON.stringify(params.inconsistencies),
    "",
    "## Historique recent",
    history.length > 0 ? history : "Aucun historique.",
    "",
    "## Nouveau message utilisateur",
    params.userMessage,
    "",
    "Met a jour le snapshot complet, les manques, les incoherences, le score de completion, et reponds avec un message coach actionnable.",
  ].join("\n");
};
