import { getAllBlogSlugs, getBlogPost } from "@/features/blog/blog-data";
import { getOgImageFont } from "@/lib/og-image-font";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
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
          Article introuvable
        </div>
      ),
      { ...size },
    );
  }

  const fonts = await getOgImageFont();

  const formattedDate = new Date(post.date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
            Blog
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
            gap: 20,
          }}
        >
          {/* Title */}
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.15,
              maxWidth: 900,
              display: "flex",
            }}
          >
            {post.title}
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: 22,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.4,
              maxWidth: 800,
              display: "flex",
            }}
          >
            {post.description.length > 120
              ? `${post.description.slice(0, 120)}...`
              : post.description}
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
          {/* Tags */}
          <div
            style={{
              display: "flex",
              gap: 8,
            }}
          >
            {post.tags.slice(0, 3).map((tag) => (
              <div
                key={tag}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 14,
                  fontWeight: 400,
                  display: "flex",
                }}
              >
                {tag}
              </div>
            ))}
          </div>

          {/* Date + reading time */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              color: "rgba(255,255,255,0.5)",
              fontSize: 14,
            }}
          >
            <span style={{ display: "flex" }}>{formattedDate}</span>
            <span style={{ display: "flex" }}>
              {post.readingTime} min de lecture
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
