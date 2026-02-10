import { SiteConfig } from "@/site-config";
import {
  Button,
  Heading,
  Text,
  Preview,
  Section,
} from "@react-email/components";
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
      <Heading as="h1" style={{ fontSize: "24px", fontWeight: "bold" }}>
        Vérifie ton adresse email
      </Heading>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        Bienvenue sur {SiteConfig.title} !
      </Text>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        Clique sur le bouton ci-dessous pour vérifier ton adresse email.
      </Text>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button
          href={url}
          style={{
            backgroundColor: "#22D3EE",
            color: "#000",
            padding: "12px 24px",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: "bold",
            textDecoration: "none",
          }}
        >
          Vérifier mon email
        </Button>
      </Section>
      <Text style={{ fontSize: "14px", color: "#64748B", marginTop: "24px" }}>
        Si tu n{"'"}as pas créé de compte, ignore cet email.
      </Text>
      <Text style={{ fontSize: "14px", lineHeight: "20px", marginTop: "16px" }}>
        À bientôt,{"\n"}L{"'"}équipe {SiteConfig.title}
      </Text>
    </EmailLayout>
  );
}
