export async function generateCvPdfBuffer(html: string): Promise<Uint8Array> {
  const playwright = await import("@playwright/test").catch(() => null);
  if (!playwright) {
    throw new Error(
      "Le moteur PDF n'est pas disponible sur cet environnement (Playwright manquant).",
    );
  }

  const browser = await playwright.chromium.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: "networkidle",
    });
    await page.emulateMedia({
      media: "print",
    });

    const bytes = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm",
      },
    });

    return bytes;
  } finally {
    await browser.close();
  }
}
