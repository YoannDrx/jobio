import { SiteConfig } from "@/site-config";
import {
  Button,
  Heading,
  Text,
  Preview,
  Section,
} from "@react-email/components";
import { EmailLayout } from "./utils/email-layout";

type DeleteAccountEmailProps = {
  url: string;
};

export default function DeleteAccountEmail({
  url = "https://example.com",
}: DeleteAccountEmailProps) {
  return (
    <EmailLayout>
      <Preview>Suppression de ton compte {SiteConfig.title}</Preview>
      <Heading as="h1" style={{ fontSize: "24px", fontWeight: "bold" }}>
        Suppression de compte
      </Heading>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>Bonjour,</Text>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        Tu as demandé à supprimer ton compte {SiteConfig.title}. Cette action
        est irréversible.
      </Text>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button
          href={url}
          style={{
            backgroundColor: "#EF4444",
            color: "#FFF",
            padding: "12px 24px",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: "bold",
            textDecoration: "none",
          }}
        >
          Confirmer la suppression
        </Button>
      </Section>
      <Text style={{ fontSize: "14px", color: "#64748B", marginTop: "24px" }}>
        Si tu n{"'"}as pas fait cette demande, ignore cet email. Ton compte
        restera actif.
      </Text>
      <Text style={{ fontSize: "14px", lineHeight: "20px", marginTop: "16px" }}>
        À bientôt,{"\n"}L{"'"}équipe {SiteConfig.title}
      </Text>
    </EmailLayout>
  );
}
