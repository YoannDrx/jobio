import { SiteConfig } from "@/site-config";
import {
  Button,
  Heading,
  Text,
  Preview,
  Section,
} from "@react-email/components";
import { emailStyles } from "./utils/email-styles";
import { BilingualDivider } from "./utils/bilingual-divider";
import { EmailLayout } from "./utils/email-layout";

type ResetPasswordEmailProps = {
  url: string;
};

export default function ResetPasswordEmail({
  url = "https://example.com",
}: ResetPasswordEmailProps) {
  return (
    <EmailLayout>
      <Preview>Réinitialise ton mot de passe {SiteConfig.title}</Preview>
      <Heading as="h1" style={emailStyles.heading}>
        Réinitialisation du mot de passe
      </Heading>
      <Text style={emailStyles.bodyText}>Bonjour,</Text>
      <Text style={emailStyles.bodyText}>
        Tu as demandé à réinitialiser ton mot de passe sur {SiteConfig.title}.
      </Text>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button href={url} style={emailStyles.primaryButton}>
          Réinitialiser mon mot de passe
        </Button>
      </Section>
      <Text style={{ ...emailStyles.mutedText, marginTop: "24px" }}>
        Si tu n{"'"}as pas fait cette demande, ignore simplement cet email.
      </Text>
      <Text
        style={{
          ...emailStyles.mutedText,
          lineHeight: "20px",
          marginTop: "16px",
        }}
      >
        À bientôt,{"\n"}L{"'"}équipe {SiteConfig.title}
      </Text>

      <BilingualDivider />

      <Heading as="h1" style={emailStyles.heading}>
        Reset your password
      </Heading>
      <Text style={emailStyles.bodyText}>Hello,</Text>
      <Text style={emailStyles.bodyText}>
        You requested a password reset on {SiteConfig.title}.
      </Text>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button href={url} style={emailStyles.primaryButton}>
          Reset my password
        </Button>
      </Section>
      <Text style={{ ...emailStyles.mutedText, marginTop: "24px" }}>
        If you didn{"'"}t make this request, simply ignore this email.
      </Text>
      <Text
        style={{
          ...emailStyles.mutedText,
          lineHeight: "20px",
          marginTop: "16px",
        }}
      >
        See you soon,{"\n"}The {SiteConfig.title} team
      </Text>
    </EmailLayout>
  );
}
