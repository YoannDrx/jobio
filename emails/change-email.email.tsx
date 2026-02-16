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
      <Heading as="h1" style={emailStyles.heading}>
        Changement d{"'"}adresse email
      </Heading>
      <Text style={emailStyles.bodyText}>Bonjour,</Text>
      <Text style={emailStyles.bodyText}>
        Tu as demandé à changer ton adresse email sur {SiteConfig.title}.
      </Text>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button href={url} style={emailStyles.primaryButton}>
          Confirmer la nouvelle adresse
        </Button>
      </Section>
      <Text style={{ ...emailStyles.mutedText, marginTop: "24px" }}>
        Si tu n{"'"}as pas fait cette demande, ignore cet email.
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
        Email address change
      </Heading>
      <Text style={emailStyles.bodyText}>Hello,</Text>
      <Text style={emailStyles.bodyText}>
        You requested to change your email address on {SiteConfig.title}.
      </Text>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button href={url} style={emailStyles.primaryButton}>
          Confirm new email
        </Button>
      </Section>
      <Text style={{ ...emailStyles.mutedText, marginTop: "24px" }}>
        If you didn{"'"}t make this request, ignore this email.
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
