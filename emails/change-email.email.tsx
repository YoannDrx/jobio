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

type ChangeEmailEmailProps = {
  url: string;
};

export default function ChangeEmailEmail({
  url = "https://example.com",
}: ChangeEmailEmailProps) {
  return (
    <EmailLayout>
      <Preview>
        Confirme ton changement d{"'"}adresse email pour {SiteConfig.title}
      </Preview>
      <Heading as="h1" style={{ fontSize: "24px", fontWeight: "bold" }}>
        Changement d{"'"}adresse email
      </Heading>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>Bonjour,</Text>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        Tu as demandé à changer ton adresse email sur {SiteConfig.title}.
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
          Confirmer la nouvelle adresse
        </Button>
      </Section>
      <Text style={{ fontSize: "14px", color: "#64748B", marginTop: "24px" }}>
        Si tu n{"'"}as pas fait cette demande, ignore cet email.
      </Text>
      <Text style={{ fontSize: "14px", lineHeight: "20px", marginTop: "16px" }}>
        À bientôt,{"\n"}L{"'"}équipe {SiteConfig.title}
      </Text>

      <BilingualDivider />

      <Heading as="h1" style={{ fontSize: "24px", fontWeight: "bold" }}>
        Email address change
      </Heading>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>Hello,</Text>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        You requested to change your email address on {SiteConfig.title}.
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
          Confirm new email
        </Button>
      </Section>
      <Text style={{ fontSize: "14px", color: "#64748B", marginTop: "24px" }}>
        If you didn{"'"}t make this request, ignore this email.
      </Text>
      <Text style={{ fontSize: "14px", lineHeight: "20px", marginTop: "16px" }}>
        See you soon,{"\n"}The {SiteConfig.title} team
      </Text>
    </EmailLayout>
  );
}
