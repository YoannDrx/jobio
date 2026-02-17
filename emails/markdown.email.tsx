import { SiteConfig } from "@/site-config";
import { Hr, Markdown, Preview, Text } from "@react-email/components";
import { emailStyles } from "./utils/email-styles";
import { EmailLayout } from "./utils/email-layout";

export default function MarkdownEmail(props: {
  markdown: string;
  preview?: string;
  disabledSignature?: boolean;
}) {
  let content = props.markdown;

  if (!props.disabledSignature) {
    content += `\n\nÀ bientôt,\nL'équipe ${SiteConfig.title}`;
  }

  // Normalize markdown by removing leading/trailing spaces from each line
  content = content
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
          letterSpacing: "2px",
          textAlign: "center" as const,
          marginBottom: "16px",
        }}
      >
        VERSION FRANÇAISE
      </Text>
      <Markdown
        markdownCustomStyles={{
          p: {
            fontSize: "16px",
            lineHeight: "26px",
            color: "#334155",
          },
          li: {
            fontSize: "16px",
            lineHeight: "26px",
            color: "#334155",
          },
          link: {
            color: "#0891b2",
          },
        }}
      >
        {content}
      </Markdown>
      <Hr style={{ margin: "40px 0 24px", borderColor: "#e2e8f0" }} />
      <Text
        style={{
          fontSize: "11px",
          color: "#94a3b8",
          textTransform: "uppercase" as const,
          letterSpacing: "2px",
          textAlign: "center" as const,
          marginBottom: "24px",
        }}
      >
        — ENGLISH VERSION —
      </Text>
      <Text style={emailStyles.mutedText}>
        The content above is in the original language.
      </Text>
    </EmailLayout>
  );
}
