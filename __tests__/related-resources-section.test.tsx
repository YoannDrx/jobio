import { RelatedResourcesSection } from "@/features/layout/related-resources-section";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("RelatedResourcesSection", () => {
  it("renders nothing when there are no resources", () => {
    const { container } = render(<RelatedResourcesSection resources={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders resource cards with links", () => {
    render(
      <RelatedResourcesSection
        resources={[
          {
            href: "/docs",
            title: "Guide",
            description: "Documentation produit",
            ctaLabel: "Lire",
          },
          {
            href: "/features",
            title: "Features",
            description: "Vue complète",
          },
        ]}
      />,
    );

    expect(screen.getByText("Guide")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lire" })).toHaveAttribute(
      "href",
      "/docs",
    );
    expect(screen.getByRole("link", { name: "Voir la page" })).toHaveAttribute(
      "href",
      "/features",
    );
  });
});
