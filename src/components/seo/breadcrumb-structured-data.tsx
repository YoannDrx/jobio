import { absoluteUrl } from "@/lib/seo";

type BreadcrumbItem = {
  name: string;
  path: `/${string}` | "/";
};

export function BreadcrumbStructuredData({ items }: { items: BreadcrumbItem[] }) {
  if (items.length < 2) {
    return null;
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
    />
  );
}
