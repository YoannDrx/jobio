import mammoth from "mammoth";
import { ApplicationError } from "@/lib/errors/application-error";

export async function extractTextFromDocx(
  buffer: ArrayBuffer,
): Promise<string> {
  const { value: text } = await mammoth.extractRawText({ arrayBuffer: buffer });

  const cleaned = text.replace(/\s+/g, " ").trim();

  if (cleaned.length < 50) {
    throw new ApplicationError("Le fichier DOCX semble vide ou illisible.");
  }

  return cleaned.slice(0, 30_000);
}
