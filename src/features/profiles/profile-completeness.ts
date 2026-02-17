const FIELD_WEIGHTS: Record<string, number> = {
  name: 10,
  headline: 15,
  bio: 10,
  skills: 15,
  experiences: 20,
  education: 5,
  certifications: 5,
  languages: 5,
  tjmTarget: 10,
  zone: 5,
};

export const FIELD_LABELS: Record<string, string> = {
  name: "Nom du profil",
  headline: "Titre professionnel",
  bio: "Bio",
  skills: "Competences",
  experiences: "Experiences",
  education: "Formation",
  certifications: "Certifications",
  languages: "Langues",
  tjmTarget: "TJM cible",
  zone: "Zone geographique",
};

function isJsonFieldFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

export type ProfileCompleteness = {
  score: number;
  missingFields: { key: string; label: string; weight: number }[];
};

export function calculateProfileCompleteness(profile: {
  name: string;
  headline: string;
  bio: string | null;
  skills: unknown;
  experiences: unknown;
  education: unknown;
  certifications: unknown;
  languages: unknown;
  tjmTarget: number | null;
  zone: string | null;
}): ProfileCompleteness {
  const missingFields: { key: string; label: string; weight: number }[] = [];
  let score = 0;

  const checkField = (key: string, filled: boolean) => {
    if (filled) {
      score += FIELD_WEIGHTS[key] ?? 0;
    } else {
      missingFields.push({
        key,
        label: FIELD_LABELS[key] ?? key,
        weight: FIELD_WEIGHTS[key] ?? 0,
      });
    }
  };

  checkField("name", Boolean(profile.name.trim()));
  checkField("headline", Boolean(profile.headline.trim()));
  checkField("bio", Boolean(profile.bio?.trim()));
  checkField("skills", isJsonFieldFilled(profile.skills));
  checkField("experiences", isJsonFieldFilled(profile.experiences));
  checkField("education", isJsonFieldFilled(profile.education));
  checkField("certifications", isJsonFieldFilled(profile.certifications));
  checkField("languages", isJsonFieldFilled(profile.languages));
  checkField("tjmTarget", profile.tjmTarget !== null && profile.tjmTarget > 0);
  checkField("zone", Boolean(profile.zone?.trim()));

  return { score, missingFields };
}
