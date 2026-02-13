import { SiteConfig } from "@/site-config";
import { Hr, Markdown, Preview, Text } from "@react-email/components";
import { EmailLayout } from "./utils/email-layout";

export default function MarkdownEmail(props: {
  markdown: string;
  preview?: string;
  disabledSignature?: boolean;
}) {
  if (!props.disabledSignature) {
    props.markdown += `

À bientôt,\n
L'équipe ${SiteConfig.title}
    `;
  }

  // Normalize markdown by removing leading/trailing spaces from each line
  props.markdown = props.markdown
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  return (
    <EmailLayout disableTailwind>
      <Preview>{props.preview ?? "You receive a markdown email."}</Preview>
      <Text
        style={{
          fontSize: "11px",
          color: "#94a3b8",
          textTransform: "uppercase" as const,
          letterSpacing: "1px",
          marginBottom: "16px",
        }}
      >
        VERSION FRANÇAISE
      </Text>
      <Markdown
        markdownCustomStyles={{
          p: {
            fontSize: "1.125rem",
            lineHeight: "1.5rem",
          },
          li: {
            fontSize: "1.125rem",
            lineHeight: "1.5rem",
          },
          link: {
            color: SiteConfig.brand.primary,
          },
        }}
      >
        {props.markdown}
      </Markdown>
      <Hr style={{ margin: "32px 0", borderColor: "#e2e8f0" }} />
      <Text
        style={{
          fontSize: "11px",
          color: "#94a3b8",
          textTransform: "uppercase" as const,
          letterSpacing: "1px",
          marginBottom: "16px",
        }}
      >
        ENGLISH VERSION
      </Text>
      <Text
        style={{
          fontSize: "14px",
          color: "#64748B",
          fontStyle: "italic",
        }}
      >
        The content above is in the original language.
      </Text>
    </EmailLayout>
  );
}
