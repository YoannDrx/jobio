"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { z } from "zod";
import { parseLinkedInZip } from "./linkedin-zip-parser";

export const importLinkedInZipAction = authAction
  .inputSchema(
    z.object({
      formData: z.instanceof(FormData),
    }),
  )
  .action(async ({ parsedInput: { formData } }) => {
    const file = formData.get("file") as File;

    if (!(file instanceof File)) {
      throw new ActionError("Aucun fichier fourni");
    }

    if (
      file.type !== "application/zip" &&
      file.type !== "application/x-zip-compressed" &&
      !file.name.endsWith(".zip")
    ) {
      throw new ActionError("Seuls les fichiers ZIP sont acceptes");
    }

    if (file.size > 50 * 1024 * 1024) {
      throw new ActionError("Le fichier est trop volumineux (max 50 Mo)");
    }

    const buffer = await file.arrayBuffer();
    const result = await parseLinkedInZip(buffer);

    return {
      headline: result.headline,
      bio: result.bio,
      skills: result.skills,
      experiences: result.experiences,
      education: result.education,
      certifications: result.certifications,
      languages: result.languages,
    };
  });
