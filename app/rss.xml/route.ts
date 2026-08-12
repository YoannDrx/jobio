import { blogPosts } from "@/features/blog/blog-data";
import { SiteConfig } from "@/site-config";

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const toRfc822Date = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? new Date().toUTCString()
    : date.toUTCString();
};

export async function GET() {
  const sortedPosts = [...blogPosts].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const latestDate = sortedPosts.at(0)?.date ?? new Date().toISOString();

  const items = sortedPosts
    .map((post) => {
      const postUrl = `${SiteConfig.prodUrl}/blog/${post.slug}`;

      return `<item>
  <title>${escapeXml(post.title)}</title>
  <link>${postUrl}</link>
  <guid isPermaLink="true">${postUrl}</guid>
  <pubDate>${toRfc822Date(post.date)}</pubDate>
  <description>${escapeXml(post.description)}</description>
</item>`;
    })
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escapeXml(SiteConfig.title)} Blog</title>
  <link>${SiteConfig.prodUrl}/blog</link>
  <description>${escapeXml("Conseils pratiques pour freelances tech: prospection, positioning, TJM et execution commerciale.")}</description>
  <language>fr-fr</language>
  <lastBuildDate>${toRfc822Date(latestDate)}</lastBuildDate>
  <atom:link href="${SiteConfig.prodUrl}/rss.xml" rel="self" type="application/rss+xml" />
${items}
</channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
