import { authRoute } from "@/lib/zod-route";
import { prisma } from "@/lib/prisma";
import { ZodRouteError } from "@/lib/errors/zod-route-error";
import { z } from "zod";

export const GET = authRoute
  .query(z.object({ profileId: z.string() }))
  .handler(async (_req, { query, ctx }) => {
    const profile = await prisma.userProfile.findFirst({
      where: { id: query.profileId, userId: ctx.user.id },
    });

    if (!profile) {
      throw new ZodRouteError("Profil introuvable", 404);
    }

    const html = generateCvHtml(profile);

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  });

type ProfileData = {
  name: string;
  headline: string;
  bio: string | null;
  skills: unknown;
  experiences: unknown;
  education: unknown;
  certifications: unknown;
  languages: unknown;
  projects: unknown;
  tjmTarget: number | null;
  zone: string | null;
};

function generateCvHtml(profile: ProfileData): string {
  const skills = Array.isArray(profile.skills)
    ? (profile.skills as { name: string }[])
    : [];

  const experiences = Array.isArray(profile.experiences)
    ? (profile.experiences as {
        title: string;
        company?: string;
        startDate?: string;
        endDate?: string;
        description?: string;
      }[])
    : [];

  const education = Array.isArray(profile.education)
    ? (profile.education as {
        degree: string;
        school?: string;
        year?: string;
      }[])
    : [];

  const certifications = Array.isArray(profile.certifications)
    ? (profile.certifications as { name: string; year?: string }[])
    : [];

  const languages = Array.isArray(profile.languages)
    ? (profile.languages as { name: string; level?: string }[])
    : [];

  const projects = Array.isArray(profile.projects)
    ? (profile.projects as {
        name: string;
        description?: string;
        url?: string;
      }[])
    : [];

  const escape = (str: string | null | undefined): string => {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  let sectionsHtml = "";

  // Bio
  if (profile.bio) {
    sectionsHtml += `
      <section style="margin-bottom: 24px;">
        <h2 style="font-size: 16px; font-weight: 600; color: #1a1a1a; border-bottom: 2px solid #e5e5e5; padding-bottom: 6px; margin: 0 0 12px 0;">A propos</h2>
        <p style="margin: 0; color: #444; line-height: 1.6;">${escape(profile.bio)}</p>
      </section>`;
  }

  // Skills
  if (skills.length > 0) {
    const badgesHtml = skills
      .map(
        (s) =>
          `<span style="display: inline-block; background: #f0f0f0; color: #333; padding: 4px 12px; border-radius: 16px; font-size: 13px; margin: 3px 4px 3px 0;">${escape(s.name)}</span>`,
      )
      .join("");
    sectionsHtml += `
      <section style="margin-bottom: 24px;">
        <h2 style="font-size: 16px; font-weight: 600; color: #1a1a1a; border-bottom: 2px solid #e5e5e5; padding-bottom: 6px; margin: 0 0 12px 0;">Competences</h2>
        <div>${badgesHtml}</div>
      </section>`;
  }

  // Experiences
  if (experiences.length > 0) {
    const expHtml = experiences
      .map(
        (e) => `
        <div style="margin-bottom: 14px;">
          <div style="font-weight: 600; color: #1a1a1a;">${escape(e.title)}</div>
          ${e.company ? `<div style="color: #666; font-size: 14px;">${escape(e.company)}${e.startDate ? ` | ${escape(e.startDate)}${e.endDate ? ` - ${escape(e.endDate)}` : " - Present"}` : ""}</div>` : ""}
          ${e.description ? `<p style="margin: 4px 0 0 0; color: #444; font-size: 14px; line-height: 1.5;">${escape(e.description)}</p>` : ""}
        </div>`,
      )
      .join("");
    sectionsHtml += `
      <section style="margin-bottom: 24px;">
        <h2 style="font-size: 16px; font-weight: 600; color: #1a1a1a; border-bottom: 2px solid #e5e5e5; padding-bottom: 6px; margin: 0 0 12px 0;">Experiences</h2>
        ${expHtml}
      </section>`;
  }

  // Education
  if (education.length > 0) {
    const eduHtml = education
      .map(
        (e) => `
        <div style="margin-bottom: 8px;">
          <span style="font-weight: 600; color: #1a1a1a;">${escape(e.degree)}</span>
          ${e.school ? `<span style="color: #666;"> - ${escape(e.school)}</span>` : ""}
          ${e.year ? `<span style="color: #999; font-size: 13px;"> (${escape(e.year)})</span>` : ""}
        </div>`,
      )
      .join("");
    sectionsHtml += `
      <section style="margin-bottom: 24px;">
        <h2 style="font-size: 16px; font-weight: 600; color: #1a1a1a; border-bottom: 2px solid #e5e5e5; padding-bottom: 6px; margin: 0 0 12px 0;">Formation</h2>
        ${eduHtml}
      </section>`;
  }

  // Certifications
  if (certifications.length > 0) {
    const certHtml = certifications
      .map(
        (c) => `
        <div style="margin-bottom: 6px;">
          <span style="color: #1a1a1a;">${escape(c.name)}</span>
          ${c.year ? `<span style="color: #999; font-size: 13px;"> (${escape(c.year)})</span>` : ""}
        </div>`,
      )
      .join("");
    sectionsHtml += `
      <section style="margin-bottom: 24px;">
        <h2 style="font-size: 16px; font-weight: 600; color: #1a1a1a; border-bottom: 2px solid #e5e5e5; padding-bottom: 6px; margin: 0 0 12px 0;">Certifications</h2>
        ${certHtml}
      </section>`;
  }

  // Languages
  if (languages.length > 0) {
    const langHtml = languages
      .map(
        (l) =>
          `<span style="display: inline-block; margin-right: 16px; color: #333;">${escape(l.name)}${l.level ? ` <span style="color: #999; font-size: 13px;">(${escape(l.level)})</span>` : ""}</span>`,
      )
      .join("");
    sectionsHtml += `
      <section style="margin-bottom: 24px;">
        <h2 style="font-size: 16px; font-weight: 600; color: #1a1a1a; border-bottom: 2px solid #e5e5e5; padding-bottom: 6px; margin: 0 0 12px 0;">Langues</h2>
        <div>${langHtml}</div>
      </section>`;
  }

  // Projects
  if (projects.length > 0) {
    const projHtml = projects
      .map(
        (p) => `
        <div style="margin-bottom: 10px;">
          <div style="font-weight: 600; color: #1a1a1a;">${escape(p.name)}${p.url ? ` <a href="${escape(p.url)}" style="color: #2563eb; font-weight: 400; font-size: 13px;">${escape(p.url)}</a>` : ""}</div>
          ${p.description ? `<p style="margin: 2px 0 0 0; color: #444; font-size: 14px;">${escape(p.description)}</p>` : ""}
        </div>`,
      )
      .join("");
    sectionsHtml += `
      <section style="margin-bottom: 24px;">
        <h2 style="font-size: 16px; font-weight: 600; color: #1a1a1a; border-bottom: 2px solid #e5e5e5; padding-bottom: 6px; margin: 0 0 12px 0;">Projets</h2>
        ${projHtml}
      </section>`;
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CV - ${escape(profile.name)}</title>
  <style>
    @media print {
      body { margin: 0; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 24px; color: #333; line-height: 1.5;">
  <header style="margin-bottom: 32px; border-bottom: 3px solid #1a1a1a; padding-bottom: 16px;">
    <h1 style="margin: 0 0 4px 0; font-size: 28px; color: #1a1a1a;">${escape(profile.name)}</h1>
    <div style="font-size: 18px; color: #555; margin-bottom: 8px;">${escape(profile.headline)}</div>
    <div style="font-size: 14px; color: #888;">
      ${profile.zone ? `${escape(profile.zone)}` : ""}${profile.zone && profile.tjmTarget ? " | " : ""}${profile.tjmTarget ? `TJM : ${profile.tjmTarget}€` : ""}
    </div>
  </header>

  ${sectionsHtml}
</body>
</html>`;
}
