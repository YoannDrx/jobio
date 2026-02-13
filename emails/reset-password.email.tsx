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

type ResetPasswordEmailProps = {
  url: string;
};

export default function ResetPasswordEmail({
  url = "https://example.com",
}: ResetPasswordEmailProps) {
  return (
    <EmailLayout>
      <Preview>Réinitialise ton mot de passe {SiteConfig.title}</Preview>
      <Heading as="h1" style={{ fontSize: "24px", fontWeight: "bold" }}>
        Réinitialisation du mot de passe
      </Heading>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>Bonjour,</Text>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        Tu as demandé à réinitialiser ton mot de passe sur {SiteConfig.title}.
      </Text>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button
          href={url}
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
          Réinitialiser mon mot de passe
        </Button>
      </Section>
      <Text style={{ fontSize: "14px", color: "#64748B", marginTop: "24px" }}>
        Si tu n{"'"}as pas fait cette demande, ignore simplement cet email.
      </Text>
      <Text style={{ fontSize: "14px", lineHeight: "20px", marginTop: "16px" }}>
        À bientôt,{"\n"}L{"'"}équipe {SiteConfig.title}
      </Text>

      <BilingualDivider />

      <Heading as="h1" style={{ fontSize: "24px", fontWeight: "bold" }}>
        Reset your password
      </Heading>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>Hello,</Text>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        You requested a password reset on {SiteConfig.title}.
      </Text>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button
          href={url}
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
          Reset my password
        </Button>
      </Section>
      <Text style={{ fontSize: "14px", color: "#64748B", marginTop: "24px" }}>
        If you didn{"'"}t make this request, simply ignore this email.
      </Text>
      <Text style={{ fontSize: "14px", lineHeight: "20px", marginTop: "16px" }}>
        See you soon,{"\n"}The {SiteConfig.title} team
      </Text>
    </EmailLayout>
  );
}
