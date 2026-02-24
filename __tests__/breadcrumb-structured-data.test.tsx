import { BreadcrumbStructuredData } from "@/components/seo/breadcrumb-structured-data";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("BreadcrumbStructuredData", () => {
  it("renders nothing when there are not enough breadcrumb items", () => {
    const { container } = render(
      <BreadcrumbStructuredData items={[{ name: "Accueil", path: "/" }]} />,
    );

    expect(container.querySelector("script")).toBeNull();
  });

  it("renders a valid breadcrumb json-ld script", () => {
    const { container } = render(
      <BreadcrumbStructuredData
        items={[
          { name: "Accueil", path: "/" },
          { name: "Fonctionnalites", path: "/features" },
        ]}
      />,
    );

    const script = container.querySelector("script");

    expect(script).not.toBeNull();
    expect(script?.textContent).toContain("\"@type\":\"BreadcrumbList\"");
    expect(script?.textContent).toContain("https://jobio.fr/features");
  });
});
