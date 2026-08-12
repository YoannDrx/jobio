import { SiteConfig } from "@/site-config";
import {
  Button,
  Heading,
  Text,
  Preview,
  Section,
} from "@react-email/components";
import { emailStyles } from "./utils/email-styles";
import { EmailLayout } from "./utils/email-layout";

type OtpSigninEmailProps = {
  otp: string;
  autoLoginUrl: string;
};

export default function OtpSigninEmail({
  otp = "000000",
  autoLoginUrl = "https://example.com",
}: OtpSigninEmailProps) {
  return (
    <EmailLayout>
      <Preview>Ton code de connexion à {SiteConfig.title}</Preview>
      <Heading as="h1" style={emailStyles.heading}>
        Ton code de connexion
      </Heading>
      <Text style={emailStyles.bodyText}>
        Utilise ce code pour te connecter.
      </Text>
      <Section style={emailStyles.card}>
        <Text
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: "#0891b2",
            margin: "0",
            letterSpacing: "4px",
            textAlign: "center",
          }}
        >
          {otp}
        </Text>
      </Section>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button href={autoLoginUrl} style={emailStyles.primaryButton}>
          Ou connecte-toi automatiquement
        </Button>
      </Section>
      <Text style={{ ...emailStyles.mutedText, marginTop: "24px" }}>
        Ce code expire dans quelques minutes.
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
    </EmailLayout>
  );
}
