import type {
  Certification,
  Education,
  Experience,
  Language,
  Skill,
} from "@/features/profiles/profiles.schema";
import JSZip from "jszip";

type LinkedInZipResult = {
  headline: string;
  bio?: string;
  skills: Skill[];
  experiences: Experience[];
  education: Education[];
  certifications: Certification[];
  languages: Language[];
};

type CSVRow = Record<string, string | undefined>;

function parseCSV(content: string): CSVRow[] {
  const lines = content.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: CSVRow = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? "";
    }
    rows.push(row);
  }

  return rows;
}

function findCSVFile(
  files: Record<string, JSZip.JSZipObject>,
  name: string,
): JSZip.JSZipObject | undefined {
  const lowerName = name.toLowerCase();
  return Object.values(files).find((f) => {
    const fileName = f.name.toLowerCase().split("/").pop() ?? "";
    return fileName === lowerName && !f.dir;
  });
}

function formatDate(raw: string): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.trim();
  if (/^\d{4}-\d{2}/.test(cleaned)) return cleaned.slice(0, 7);
  if (/^\d{4}$/.test(cleaned)) return cleaned;
  const date = new Date(cleaned);
  if (!isNaN(date.getTime())) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  return undefined;
}

export async function parseLinkedInZip(
  buffer: ArrayBuffer,
): Promise<LinkedInZipResult> {
  const zip = await JSZip.loadAsync(buffer);

  let headline = "";
  let bio: string | undefined;
  const skills: Skill[] = [];
  const experiences: Experience[] = [];
  const educationList: Education[] = [];
  const certifications: Certification[] = [];
  const languages: Language[] = [];

  // Profile.csv
  const profileFile = findCSVFile(zip.files, "profile.csv");
  if (profileFile) {
    const content = await profileFile.async("string");
    const rows = parseCSV(content);
    if (rows[0]) {
      const row = rows[0];
      const firstName = row["First Name"] ?? "";
      const lastName = row["Last Name"] ?? "";
      headline = row.Headline ?? `${firstName} ${lastName}`.trim();
      bio = row.Summary ?? undefined;
    }
  }

  // Positions.csv
  const positionsFile = findCSVFile(zip.files, "positions.csv");
  if (positionsFile) {
    const content = await positionsFile.async("string");
    const rows = parseCSV(content);
    for (const row of rows) {
      const title = row.Title ?? "";
      const company = row["Company Name"] ?? "";
      if (!title && !company) continue;
      experiences.push({
        title: title || "Poste",
        company: company || "Entreprise",
        startDate: formatDate(row["Started On"] ?? "") ?? undefined,
        endDate: formatDate(row["Finished On"] ?? "") ?? undefined,
        description: row.Description ?? undefined,
      });
    }
  }

  // Education.csv
  const educationFile = findCSVFile(zip.files, "education.csv");
  if (educationFile) {
    const content = await educationFile.async("string");
    const rows = parseCSV(content);
    for (const row of rows) {
      const school = row["School Name"] ?? "";
      const degree = row["Degree Name"] ?? "";
      if (!school && !degree) continue;
      educationList.push({
        degree: degree || "Formation",
        school: school || "Etablissement",
        field: row.Notes ?? undefined,
        startDate: formatDate(row["Start Date"] ?? "") ?? undefined,
        endDate: formatDate(row["End Date"] ?? "") ?? undefined,
      });
    }
  }

  // Skills.csv
  const skillsFile = findCSVFile(zip.files, "skills.csv");
  if (skillsFile) {
    const content = await skillsFile.async("string");
    const rows = parseCSV(content);
    for (const row of rows) {
      const name = row.Name ?? "";
      if (!name) continue;
      skills.push({
        name,
        level: "INTERMEDIATE",
      });
    }
  }

  // Languages.csv
  const languagesFile = findCSVFile(zip.files, "languages.csv");
  if (languagesFile) {
    const content = await languagesFile.async("string");
    const rows = parseCSV(content);
    for (const row of rows) {
      const name = row.Name ?? "";
      if (!name) continue;
      const proficiency = (row.Proficiency ?? "").toLowerCase();
      let level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "FLUENT" =
        "INTERMEDIATE";
      if (
        proficiency.includes("native") ||
        proficiency.includes("full professional") ||
        proficiency.includes("bilingu")
      ) {
        level = "FLUENT";
      } else if (
        proficiency.includes("professional") ||
        proficiency.includes("avance") ||
        proficiency.includes("advanced")
      ) {
        level = "ADVANCED";
      } else if (
        proficiency.includes("elementary") ||
        proficiency.includes("beginner") ||
        proficiency.includes("notion")
      ) {
        level = "BEGINNER";
      }
      languages.push({ name, level });
    }
  }

  // Certifications.csv
  const certsFile = findCSVFile(zip.files, "certifications.csv");
  if (certsFile) {
    const content = await certsFile.async("string");
    const rows = parseCSV(content);
    for (const row of rows) {
      const name = row.Name ?? "";
      if (!name) continue;
      certifications.push({
        name,
        issuer: row.Authority ?? "Non precise",
        issueDate:
          formatDate(row["Started On"] ?? row["License Number"] ?? "") ??
          undefined,
      });
    }
  }

  if (!headline) {
    headline = "Profil LinkedIn";
  }

  return {
    headline,
    bio,
    skills: skills.slice(0, 15),
    experiences,
    education: educationList,
    certifications,
    languages,
  };
}
