import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { route } from "@/lib/zod-route";

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatIcsDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

export const GET = route.handler(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ message: "Token requis" }, { status: 400 });
  }

  const feedToken = await prisma.calendarFeedToken.findUnique({
    where: { token },
  });

  if (!feedToken) {
    return NextResponse.json({ message: "Token invalide" }, { status: 401 });
  }

  if (feedToken.expiresAt && feedToken.expiresAt < new Date()) {
    return NextResponse.json({ message: "Token expiré" }, { status: 401 });
  }

  const followUps = await prisma.followUp.findMany({
    where: {
      userId: feedToken.userId,
      completedAt: null,
    },
    include: {
      mission: {
        select: {
          title: true,
          company: true,
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });

  const now = new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Jobio//Calendar Feed//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Jobio - Relances",
    "X-WR-TIMEZONE:Europe/Paris",
  ];

  for (const followUp of followUps) {
    const missionInfo = followUp.mission.company
      ? `${followUp.mission.title} (${followUp.mission.company})`
      : followUp.mission.title;

    const dtStart = formatIcsDate(followUp.scheduledAt);
    const dtStamp = formatIcsDate(now);

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${followUp.id}@jobio`);
    lines.push(`DTSTAMP:${dtStamp}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DURATION:PT30M`);
    lines.push(`SUMMARY:${escapeIcsText(followUp.title)}`);
    lines.push(`DESCRIPTION:${escapeIcsText(`Mission: ${missionInfo}`)}`);
    lines.push(`CATEGORIES:${escapeIcsText(followUp.type)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  const icsContent = lines.join("\r\n");

  return new NextResponse(icsContent, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="jobio-calendar.ics"',
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
});
