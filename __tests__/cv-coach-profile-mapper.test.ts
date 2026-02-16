import {
  buildProfileUpdateFromCvCoach,
  type ProfileCoachMergeMode,
} from "@/features/cv-lab/cv-coach-profile-mapper";
import { cvCoachSnapshotSchema } from "@/features/cv-lab/cv-coach.schema";
import { Prisma } from "@/generated/prisma";
import { describe, expect, it } from "vitest";

type ProfileLike = Parameters<typeof buildProfileUpdateFromCvCoach>[0]["currentProfile"];

const makeCurrentProfile = (): ProfileLike => ({
  headline: "Frontend Engineer",
  bio: "Existing summary",
  skills: [{ name: "React", level: "ADVANCED" }],
  experiences: [
    {
      title: "Developer",
      company: "Legacy Corp",
      startDate: "2020",
      endDate: "2021",
      description: "Legacy role",
    },
  ],
  education: [],
  certifications: [],
  languages: [{ name: "Francais", level: "FLUENT" }],
  projects: [],
  zone: "Paris",
});

const makeSnapshot = () =>
  cvCoachSnapshotSchema.parse({
    identity: {
      fullName: "Yoann",
      headline: "Senior React Native Engineer",
      targetRole: "Senior React Native Engineer",
      location: "Paris",
      email: "",
      phone: "",
      website: "",
      linkedinUrl: "",
    },
    summary: "Built and scaled mobile products.",
    experiences: [
      {
        title: "React Native Developer",
        company: "Klesia",
        location: "Paris",
        startDate: "09/2021",
        endDate: "Present",
        description: "Mobile app development",
        achievements: ["50+ releases", "Reduced support tickets"],
        techStack: ["React Native", "TypeScript"],
      },
    ],
    education: [
      {
        degree: "Bachelor",
        school: "La Capsule",
        field: "Web & Mobile",
        location: "Paris",
        startDate: "2021",
        endDate: "2021",
        description: "Bootcamp",
      },
    ],
    certifications: [
      {
        name: "RN Advanced",
        issuer: "Internal",
        issueDate: "2025",
        expirationDate: "",
      },
    ],
    languages: [
      {
        name: "English",
        level: "C1",
      },
    ],
    projects: [
      {
        name: "Jobio",
        role: "Founder",
        startDate: "2025",
        endDate: "",
        description: "Freelance CRM",
        impact: "Live product",
        url: "https://www.jobio.fr",
        techStack: ["Next.js", "TypeScript"],
      },
    ],
    skills: {
      hard: ["React Native", "TypeScript"],
      soft: ["Leadership"],
      tools: ["GitHub Actions"],
    },
    achievements: [],
    interests: [],
    constraints: {
      availability: "Immediate",
      tjmTarget: "650",
      salaryTarget: "",
      contractType: "Freelance",
      workMode: "Hybrid",
      mobility: "France",
    },
  });

const parseJson = <T,>(value: unknown): T[] => {
  if (value === Prisma.JsonNull) {
    return [];
  }

  return Array.isArray(value) ? (value as T[]) : [];
};

describe("buildProfileUpdateFromCvCoach", () => {
  it("replaces profile data in REPLACE mode", () => {
    const result = buildProfileUpdateFromCvCoach({
      snapshot: makeSnapshot(),
      mode: "REPLACE",
      currentProfile: makeCurrentProfile(),
    });

    const skills = parseJson<{ name: string }>(result.skills);
    const experiences = parseJson<{ title: string; company: string }>(result.experiences);

    expect(result.headline).toBe("Senior React Native Engineer");
    expect(result.bio).toContain("Built and scaled mobile products.");
    expect(result.zone).toBe("Paris");
    expect(skills.map((item) => item.name)).toEqual([
      "React Native",
      "TypeScript",
      "GitHub Actions",
    ]);
    expect(experiences[0]).toMatchObject({
      title: "React Native Developer",
      company: "Klesia",
    });
  });

  it("merges data while keeping existing records in MERGE mode", () => {
    const snapshot = makeSnapshot();
    snapshot.skills.hard = ["React", "TypeScript"];

    const result = buildProfileUpdateFromCvCoach({
      snapshot,
      mode: "MERGE" as ProfileCoachMergeMode,
      currentProfile: makeCurrentProfile(),
    });

    const skills = parseJson<{ name: string }>(result.skills);
    const experiences = parseJson<{ company: string }>(result.experiences);

    expect(result.bio).toContain("Built and scaled mobile products.");
    expect(result.bio).toContain("Existing summary");
    expect(skills.map((item) => item.name)).toEqual([
      "React",
      "TypeScript",
      "GitHub Actions",
    ]);
    expect(experiences.map((item) => item.company)).toContain("Legacy Corp");
    expect(experiences.map((item) => item.company)).toContain("Klesia");
  });
});
