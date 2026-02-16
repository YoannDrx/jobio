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

type VerifyEmailEmailProps = {
  url: string;
};

export default function VerifyEmailEmail({
  url = "https://example.com",
}: VerifyEmailEmailProps) {
  return (
    <EmailLayout>
      <Preview>Vérifie ton adresse email pour {SiteConfig.title}</Preview>
      <Heading as="h1" style={emailStyles.heading}>
        Vérifie ton adresse email
      </Heading>
      <Text style={emailStyles.bodyText}>
        Bienvenue sur {SiteConfig.title} !
      </Text>
      <Text style={emailStyles.bodyText}>
        Clique sur le bouton ci-dessous pour vérifier ton adresse email.
      </Text>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button href={url} style={emailStyles.primaryButton}>
          Vérifier mon email
        </Button>
      </Section>
      <Text style={{ ...emailStyles.mutedText, marginTop: "24px" }}>
        Si tu n{"'"}as pas créé de compte, ignore cet email.
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
        Verify your email address
      </Heading>
      <Text style={emailStyles.bodyText}>Welcome to {SiteConfig.title}!</Text>
      <Text style={emailStyles.bodyText}>
        Click the button below to verify your email address.
      </Text>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button href={url} style={emailStyles.primaryButton}>
          Verify my email
        </Button>
      </Section>
      <Text style={{ ...emailStyles.mutedText, marginTop: "24px" }}>
        If you didn{"'"}t create an account, ignore this email.
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
