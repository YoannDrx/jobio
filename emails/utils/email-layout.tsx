import { SiteConfig } from "@/site-config";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import type { PropsWithChildren } from "react";

/**
 * EmailLayout is used to create a layout for your email.
 * @param props.children The children of the layout
 * @param props.disableTailwind If true, the children will be rendered without the Tailwind CSS. It's useful when you want use <Markdown /> tag.
 * @returns
 */
export const EmailLayout = (
  props: PropsWithChildren<{ disableTailwind?: boolean }>,
) => {
  // Always use prodUrl for email images — localhost and preview URLs
  // are not reachable by email clients
  const baseUrl = SiteConfig.prodUrl;

  return (
    <Html>
      <Head />
      <Body
        style={{
          backgroundColor: "#f1f5f9",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
          margin: "0",
          padding: "0",
        }}
      >
        <Container
          style={{
            maxWidth: "580px",
            margin: "40px auto",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          {/* Gradient top bar — fallback backgroundColor for Outlook */}
          <div
            style={{
              height: "6px",
              background: "linear-gradient(90deg, #06b6d4, #8b5cf6)",
              backgroundColor: "#06b6d4",
            }}
          />

          {/* Header */}
          <div style={{ padding: "28px 0 20px", textAlign: "center" }}>
            <Img
              src={`${baseUrl}${SiteConfig.emailIcon}`}
              width={56}
              height={56}
              alt={`${SiteConfig.title}'s logo`}
              style={{
                borderRadius: "12px",
                margin: "0 auto",
              }}
            />
            <Text
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#0e7490",
                margin: "12px 0 0",
              }}
            >
              {SiteConfig.title}
            </Text>
          </div>

          <Hr style={{ borderColor: "#e2e8f0", margin: "0 24px" }} />

          {/* Content */}
          <div style={{ padding: "32px 24px" }}>
            {props.disableTailwind ? (
              props.children
            ) : (
              <Tailwind>{props.children}</Tailwind>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              borderTop: "1px solid #e2e8f0",
              padding: "24px",
              textAlign: "center",
            }}
          >
            <Img
              src={`${baseUrl}${SiteConfig.emailIcon}`}
              width={24}
              height={24}
              alt={`${SiteConfig.title}'s logo`}
              style={{
                borderRadius: "6px",
                margin: "0 auto",
              }}
            />
            <Text
              style={{
                fontSize: "12px",
                color: "#94a3b8",
                margin: "8px 0 0",
              }}
            >
              {SiteConfig.title} · {SiteConfig.domain}
            </Text>
            <Text
              style={{
                fontSize: "11px",
                color: "#cbd5e1",
                margin: "4px 0 0",
              }}
            >
              Cet email a été envoyé automatiquement par {SiteConfig.title}.
            </Text>
          </div>
        </Container>
      </Body>
    </Html>
  );
};
