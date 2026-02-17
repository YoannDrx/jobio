import { prisma } from "@/lib/prisma";
import { authRoute } from "@/lib/zod-route";
import { importCvCoachDocumentSchema } from "@/features/cv-lab/cv-coach.schema";

export const POST = authRoute
  .body(importCvCoachDocumentSchema)
  .handler(async (_req, { body, ctx }) => {
    const user = ctx.user;

    const session = await prisma.cvLabCoachSession.findFirst({
      where: {
        id: body.sessionId,
        userId: user.id,
      },
    });

    if (!session) {
      return Response.json({ error: "Session introuvable" }, { status: 404 });
    }

    // Store the imported text as a user message
    await prisma.cvLabCoachMessage.create({
      data: {
        sessionId: session.id,
        userId: user.id,
        role: "USER",
        content: `[CV IMPORTÉ]\n\n${body.text}`,
      },
    });

    return Response.json({ success: true, sessionId: session.id });
  });
