/* eslint-disable no-await-in-loop, @typescript-eslint/no-unnecessary-condition -- redirects and streaming chunks must be validated sequentially */
import { ApplicationError } from "@/lib/errors/application-error";
import { assertPublicHostnameResolvesSafely } from "@/lib/security/public-url";
import { upfetch } from "@/lib/up-fetch";

const MAX_REDIRECTS = 5;
const MAX_RESPONSE_BYTES = 1_000_000;
const ALLOWED_CONTENT_TYPES = [
  "text/html",
  "text/plain",
  "application/xhtml+xml",
] as const;

const readTextWithLimit = async (
  response: Response,
  maxBytes: number,
): Promise<string> => {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytesRead += value.byteLength;
    if (bytesRead > maxBytes) {
      await reader.cancel();
      throw new ApplicationError("La page distante est trop volumineuse.");
    }
    text += decoder.decode(value, { stream: true });
  }

  return text + decoder.decode();
};

export async function fetchUrlContent(url: string): Promise<string> {
  let currentUrl = url;
  let html = "";

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    const safeUrl = await assertPublicHostnameResolvesSafely(currentUrl).catch(
      () => {
        throw new ApplicationError(
          "Utilise une URL HTTPS publique, sans adresse locale ou privée.",
        );
      },
    );

    const result = await upfetch(safeUrl.toString(), {
      redirect: "manual",
      timeout: 10_000,
      retry: { attempts: 0 },
      reject: () => false,
      headers: {
        "User-Agent": "Jobio/1.0 (+https://jobio.fr)",
        Accept: "text/html,text/plain,application/xhtml+xml",
      },
      parseResponse: async (response) => {
        const contentLength = Number(
          response.headers.get("content-length") ?? 0,
        );
        if (contentLength > MAX_RESPONSE_BYTES) {
          throw new ApplicationError("La page distante est trop volumineuse.");
        }
        const contentType = response.headers
          .get("content-type")
          ?.split(";", 1)[0]
          ?.trim()
          .toLowerCase();
        const body =
          response.status >= 300 && response.status < 400
            ? ""
            : await readTextWithLimit(response, MAX_RESPONSE_BYTES);
        return {
          status: response.status,
          location: response.headers.get("location"),
          contentType,
          body,
        };
      },
    });

    if (result.status >= 300 && result.status < 400) {
      if (!result.location || redirectCount === MAX_REDIRECTS) {
        throw new ApplicationError("La page distante redirige trop de fois.");
      }
      currentUrl = new URL(result.location, safeUrl).toString();
      continue;
    }

    if (result.status < 200 || result.status >= 300) {
      throw new ApplicationError(
        `Impossible de récupérer l'URL : ${result.status}`,
      );
    }

    if (
      !result.contentType ||
      !ALLOWED_CONTENT_TYPES.includes(
        result.contentType as (typeof ALLOWED_CONTENT_TYPES)[number],
      )
    ) {
      throw new ApplicationError(
        "Le type de contenu de cette URL n’est pas pris en charge.",
      );
    }

    html = result.body;
    break;
  }

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
