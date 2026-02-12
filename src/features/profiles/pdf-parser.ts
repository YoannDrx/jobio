import { extractText } from "unpdf";
import { ApplicationError } from "@/lib/errors/application-error";

export async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  const { text } = await extractText(new Uint8Array(buffer), {
    mergePages: true,
  });

  const cleaned = text.replace(/\s+/g, " ").trim();

  if (cleaned.length < 50) {
    throw new ApplicationError(
      "Le PDF semble vide ou illisible. Vérifie qu'il s'agit bien d'un export LinkedIn.",
    );
  }

  return cleaned.slice(0, 30_000);
}
