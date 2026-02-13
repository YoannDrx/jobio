import { SiteConfig } from "@/site-config";
import {
  Button,
  Heading,
  Text,
  Preview,
  Section,
} from "@react-email/components";
import { BilingualDivider } from "./utils/bilingual-divider";
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
      <Heading as="h1" style={{ fontSize: "24px", fontWeight: "bold" }}>
        Ton code de connexion
      </Heading>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        Utilise ce code pour te connecter.
      </Text>
      <Section
        style={{
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
          padding: "16px",
          margin: "16px 0",
          textAlign: "center",
        }}
      >
        <Text
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: SiteConfig.brand.primary,
            margin: "0",
            letterSpacing: "4px",
          }}
        >
          {otp}
        </Text>
      </Section>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button
          href={autoLoginUrl}
          style={{
            backgroundColor: SiteConfig.brand.primary,
            color: "#000",
            padding: "12px 24px",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: "bold",
            textDecoration: "none",
          }}
        >
          Ou connecte-toi automatiquement
        </Button>
      </Section>
      <Text style={{ fontSize: "14px", color: "#64748B", marginTop: "24px" }}>
        Ce code expire dans quelques minutes.
      </Text>
      <Text style={{ fontSize: "14px", lineHeight: "20px", marginTop: "16px" }}>
        À bientôt,{"\n"}L{"'"}équipe {SiteConfig.title}
      </Text>

      <BilingualDivider />

      <Heading as="h1" style={{ fontSize: "24px", fontWeight: "bold" }}>
        Your sign-in code
      </Heading>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        Use this code to sign in.
      </Text>
      <Section
        style={{
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
          padding: "16px",
          margin: "16px 0",
          textAlign: "center",
        }}
      >
        <Text
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: SiteConfig.brand.primary,
            margin: "0",
            letterSpacing: "4px",
          }}
        >
          {otp}
        </Text>
      </Section>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button
          href={autoLoginUrl}
          style={{
            backgroundColor: SiteConfig.brand.primary,
            color: "#000",
            padding: "12px 24px",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: "bold",
            textDecoration: "none",
          }}
        >
          Or sign in automatically
        </Button>
      </Section>
      <Text style={{ fontSize: "14px", color: "#64748B", marginTop: "24px" }}>
        This code expires in a few minutes.
      </Text>
      <Text style={{ fontSize: "14px", lineHeight: "20px", marginTop: "16px" }}>
        See you soon,{"\n"}The {SiteConfig.title} team
      </Text>
    </EmailLayout>
  );
}
