type MasterCvForCompleteness = {
  fullName: string;
  headline: string | null;
  summary: string | null;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  experiences: unknown;
  skills: unknown;
  education: unknown;
  socialLinks: unknown;
};

type CompletenessResult = {
  score: number;
  missing: string[];
};

export function computeMasterCvCompleteness(
  masterCv: MasterCvForCompleteness,
): CompletenessResult {
  const criteria = [
    { label: "Nom complet", check: () => Boolean(masterCv.fullName.trim()) },
    {
      label: "Titre professionnel",
      check: () => Boolean(masterCv.headline?.trim()),
    },
    { label: "Résumé", check: () => Boolean(masterCv.summary?.trim()) },
    { label: "Email", check: () => Boolean(masterCv.email?.trim()) },
    { label: "Téléphone", check: () => Boolean(masterCv.phone?.trim()) },
    {
      label: "Au moins 2 expériences",
      check: () => {
        const items = Array.isArray(masterCv.experiences)
          ? masterCv.experiences
          : [];
        return items.length >= 2;
      },
    },
    {
      label: "Expériences avec description",
      check: () => {
        const items = Array.isArray(masterCv.experiences)
          ? masterCv.experiences
          : [];
        return items.some((e: unknown) => {
          const exp = e as { description?: string };
          return exp.description?.trim();
        });
      },
    },
    {
      label: "Au moins 5 compétences",
      check: () => {
        const items = Array.isArray(masterCv.skills) ? masterCv.skills : [];
        return items.length >= 5;
      },
    },
    {
      label: "Au moins 1 formation",
      check: () => {
        const items = Array.isArray(masterCv.education)
          ? masterCv.education
          : [];
        return items.length >= 1;
      },
    },
    {
      label: "Au moins 1 lien social",
      check: () => {
        if (!masterCv.socialLinks || typeof masterCv.socialLinks !== "object")
          return false;
        const links = masterCv.socialLinks as Record<string, unknown>;
        return Object.values(links).some(
          (v) => typeof v === "string" && v.trim(),
        );
      },
    },
  ];

  const missing: string[] = [];
  let passed = 0;

  for (const criterion of criteria) {
    if (criterion.check()) {
      passed++;
    } else {
      missing.push(criterion.label);
    }
  }

  return {
    score: Math.round((passed / criteria.length) * 100),
    missing,
  };
}
