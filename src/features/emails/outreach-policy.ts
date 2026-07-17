const ACCEPTED_EMAIL_STATUSES = new Set([
  "sent",
  "delivered",
  "opened",
  "clicked",
]);

export type OutreachWindowReason =
  | "invalid_time_zone"
  | "outside_business_days"
  | "outside_business_hours";

export const OUTREACH_WINDOW_MESSAGES: Record<OutreachWindowReason, string> = {
  invalid_time_zone:
    "Le fuseau horaire du navigateur est invalide. Actualise la page avant de réessayer.",
  outside_business_days:
    "Les emails de relance sont limités aux jours ouvrés. Enregistre le message en brouillon pour le prochain jour ouvré.",
  outside_business_hours:
    "Les emails de relance sont envoyés entre 8 h et 18 h, heure locale. Enregistre le message en brouillon pour plus tard.",
};

export const isAcceptedEmailStatus = (status: string) =>
  ACCEPTED_EMAIL_STATUSES.has(status);

export const sanitizeProviderFailure = (message: string) =>
  message
    .replace(/[\r\n\t]+/g, " ")
    .trim()
    .slice(0, 500) || "Erreur fournisseur non détaillée";

export const evaluateOutreachWindow = (
  now: Date,
  timeZone: string,
): OutreachWindowReason | null => {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      hour: "2-digit",
      hour12: false,
    }).formatToParts(now);
  } catch {
    return "invalid_time_zone";
  }

  const weekday = parts.find((part) => part.type === "weekday")?.value;
  const hour = Number(parts.find((part) => part.type === "hour")?.value);

  if (weekday === "Sat" || weekday === "Sun") {
    return "outside_business_days";
  }
  if (!Number.isFinite(hour) || hour < 8 || hour >= 18) {
    return "outside_business_hours";
  }
  return null;
};
