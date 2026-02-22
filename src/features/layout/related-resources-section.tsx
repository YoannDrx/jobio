import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { PublicSection } from "./public-page-shell";

export type RelatedResource = {
  href: `/${string}` | "/";
  title: string;
  description: string;
  ctaLabel?: string;
};

type RelatedResourcesSectionProps = {
  title?: string;
  description?: string;
  resources: RelatedResource[];
  className?: string;
};

export function RelatedResourcesSection({
  title = "Ressources liées",
  description = "Approfondis le sujet avec ces pages complémentaires.",
  resources,
  className,
}: RelatedResourcesSectionProps) {
  if (resources.length === 0) {
    return null;
  }

  return (
    <PublicSection title={title} description={description} className={className}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <div key={resource.href} className="rounded-xl border p-4">
            <p className="font-medium">{resource.title}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {resource.description}
            </p>
            <Link
              href={resource.href}
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                "mt-3",
              )}
            >
              {resource.ctaLabel ?? "Voir la page"}
            </Link>
          </div>
        ))}
      </div>
    </PublicSection>
  );
}
