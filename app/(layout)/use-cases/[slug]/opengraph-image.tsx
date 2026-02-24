import { JOBIO_USE_CASES, getUseCaseBySlug } from "@/features/seo/use-cases";
import { getOgImageFont } from "@/lib/og-image-font";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return JOBIO_USE_CASES.map((item) => ({ slug: item.slug }));
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const useCase = getUseCaseBySlug(slug);

  if (!useCase) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0a0a0a",
            color: "#ffffff",
            fontSize: 48,
            fontFamily: "Geist",
          }}
        >
          Use case introuvable
        </div>
      ),
      { ...size },
    );
  }

  const fonts = await getOgImageFont();

  const planLabel = useCase.recommendedPlan.toUpperCase();
  const planColor =
    useCase.recommendedPlan === "ultra"
      ? "#8b5cf6"
      : useCase.recommendedPlan === "pro"
        ? "#22D3EE"
        : "#10b981";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0a0a0a",
          fontFamily: "Geist",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background gradient */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -200,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -150,
            left: -150,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "40px 48px 0 48px",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "linear-gradient(135deg, #22D3EE, #0ea5e9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0a0a0a",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              J
            </div>
            <span
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#ffffff",
              }}
            >
              Jobio
            </span>
          </div>

          {/* Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "6px 16px",
              borderRadius: 20,
              border: "1px solid rgba(34,211,238,0.4)",
              color: "#22D3EE",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Use case
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "40px 48px",
            justifyContent: "center",
            gap: 24,
          }}
        >
          {/* Persona */}
          <div
            style={{
              fontSize: 20,
              fontWeight: 400,
              color: "#22D3EE",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#22D3EE",
                display: "flex",
              }}
            />
            {useCase.persona}
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 46,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.15,
              maxWidth: 900,
              display: "flex",
            }}
          >
            {useCase.title}
          </div>

          {/* Summary */}
          <div
            style={{
              fontSize: 20,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.4,
              maxWidth: 800,
              display: "flex",
            }}
          >
            {useCase.summary.length > 140
              ? `${useCase.summary.slice(0, 140)}...`
              : useCase.summary}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 48px 40px 48px",
          }}
        >
          {/* Pain points count */}
          <div
            style={{
              display: "flex",
              gap: 20,
              color: "rgba(255,255,255,0.5)",
              fontSize: 14,
            }}
          >
            <span style={{ display: "flex" }}>
              {useCase.workflowSteps.length} etapes de workflow
            </span>
            <span style={{ display: "flex" }}>
              {useCase.featureHighlights.length} modules cles
            </span>
          </div>

          {/* Plan badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 18px",
              borderRadius: 10,
              backgroundColor: "rgba(255,255,255,0.06)",
              border: `1px solid ${planColor}40`,
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.6)",
                display: "flex",
              }}
            >
              Plan recommande
            </span>
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: planColor,
                letterSpacing: 1,
                display: "flex",
              }}
            >
              {planLabel}
            </span>
          </div>
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #22D3EE, #0ea5e9, #22D3EE)",
            display: "flex",
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts,
    },
  );
}
