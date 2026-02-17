import { ApplicationError } from "@/lib/errors/application-error";

export async function fetchUrlContent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Jobio/1.0)",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new ApplicationError(
      `Impossible de récupérer l'URL : ${response.status}`,
    );
  }

  const html = await response.text();

  const text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#?\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length < 50) {
    throw new ApplicationError(
      "Le contenu extrait est trop court. Essayez de coller le texte directement.",
    );
  }

  return text.slice(0, 8000);
}
