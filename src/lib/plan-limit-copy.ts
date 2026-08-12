export function getPlanUpgradeLabel(plan: string): string {
  if (plan === "free") return "Pro";
  return "";
}

export function getPlanUpgradeButtonText(plan: string): string {
  if (plan === "free") return "Passer en Pro";
  return "Gérer l'abonnement";
}

export function getPlanLimitMessage(
  plan: string,
  isExhausted: boolean,
): string {
  if (plan === "pro") return "Limite du plan Pro atteinte";
  const action = isExhausted ? "continuer" : "en avoir plus";
  return `Passe en ${getPlanUpgradeLabel(plan)} pour ${action}.`;
}

export function getUpgradeMessage(plan: string): string {
  if (plan === "free") return "Passe en Pro pour débloquer";
  return "Limite du plan Pro atteinte. Contacte le support si nécessaire";
}
