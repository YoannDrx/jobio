"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { extractTextFromPDF } from "@/features/profiles/pdf-parser";
import { extractTextFromDocx } from "./cv-coach-docx-parser";

export const importCvCoachFileAction = authAction
  .inputSchema(
    z.object({
      formData: z.instanceof(FormData),
      sessionId: z.string().min(1),
    }),
  )
  .action(async ({ parsedInput: { formData, sessionId }, ctx: { user } }) => {
    const file = formData.get("file") as File;

    if (!(file instanceof File)) {
      throw new ActionError("Aucun fichier fourni");
    }

    const mimeType = file.type;
    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    // Validate file type by MIME type first, then by extension as fallback
    let isValidType = false;
    if (mimeType === "application/pdf" || fileExtension === "pdf") {
      isValidType = true;
    } else if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileExtension === "docx"
    ) {
      isValidType = true;
    }

    if (!isValidType) {
      throw new ActionError("Seuls les fichiers PDF et DOCX sont acceptés");
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new ActionError("Le fichier est trop volumineux (max 5 Mo)");
    }

    // Verify session ownership
    const session = await prisma.cvLabCoachSession.findFirst({
      where: {
        id: sessionId,
        userId: user.id,
      },
    });

    if (!session) {
      throw new ActionError("Session CV Coach introuvable");
    }

    const buffer = await file.arrayBuffer();

    let extractedText: string;
    if (mimeType === "application/pdf" || fileExtension === "pdf") {
      extractedText = await extractTextFromPDF(buffer);
    } else {
      extractedText = await extractTextFromDocx(buffer);
    }

    // Store as message with prefix
    await prisma.cvLabCoachMessage.create({
      data: {
        sessionId: session.id,
        userId: user.id,
        role: "USER",
        content: `[CV IMPORTÉ DEPUIS FICHIER]\n\n${extractedText}`,
      },
    });

    return {
      success: true,
      extractedText,
    };
  });
