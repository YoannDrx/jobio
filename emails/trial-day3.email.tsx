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
import { emailStyles } from "./utils/email-styles";

type TrialDay3EmailProps = {
  name: string;
};

export default function TrialDay3Email({
  name = "Freelance",
}: TrialDay3EmailProps) {
  return (
    <EmailLayout>
      <Preview>
        3 astuces pour booster ta prospection avec {SiteConfig.title}
      </Preview>
      <Heading as="h1" style={emailStyles.heading}>
        3 astuces pour tirer le max de {SiteConfig.title}
      </Heading>
      <Text style={emailStyles.bodyText}>Salut {name},</Text>
      <Text style={emailStyles.bodyText}>
        Tu utilises {SiteConfig.title} depuis 3 jours. Voici comment en profiter
        au maximum :
      </Text>
      <Section
        style={{
          ...emailStyles.card,
          padding: "16px",
          margin: "16px 0",
        }}
      >
        <Text
          style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 8px" }}
        >
          1. Colle directement une URL d&apos;annonce
        </Text>
        <Text style={{ ...emailStyles.mutedText, margin: "0 0 16px" }}>
          L&apos;IA extrait automatiquement le titre, le TJM, la stack et plus
          encore.
        </Text>
        <Text
          style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 8px" }}
        >
          2. Planifie tes relances
        </Text>
        <Text style={{ ...emailStyles.mutedText, margin: "0 0 16px" }}>
          Utilise les séquences automatiques pour ne jamais oublier de relancer.
        </Text>
        <Text
          style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 8px" }}
        >
          3. Suis tes analytics
        </Text>
        <Text style={{ ...emailStyles.mutedText, margin: "0" }}>
          Visualise ton entonnoir de conversion et ton taux de réponse par
          plateforme.
        </Text>
      </Section>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button
          href={`${SiteConfig.prodUrl}/app`}
          style={emailStyles.primaryButton}
        >
          Ouvrir mon pipeline
        </Button>
      </Section>
      <Text
        style={{
          ...emailStyles.mutedText,
          lineHeight: "20px",
          marginTop: "16px",
        }}
      >
        À bientôt,{"\n"}
        L&apos;équipe {SiteConfig.title}
      </Text>

      <BilingualDivider />

      <Heading as="h1" style={emailStyles.heading}>
        3 tips to get the most out of {SiteConfig.title}
      </Heading>
      <Text style={emailStyles.bodyText}>Hi {name},</Text>
      <Text style={emailStyles.bodyText}>
        You{"'"}ve been using {SiteConfig.title} for 3 days. Here{"'"}s how to
        make the most of it:
      </Text>
      <Section
        style={{
          ...emailStyles.card,
          padding: "16px",
          margin: "16px 0",
        }}
      >
        <Text
          style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 8px" }}
        >
          1. Paste a job listing URL directly
        </Text>
        <Text style={{ ...emailStyles.mutedText, margin: "0 0 16px" }}>
          AI automatically extracts the title, rate, tech stack and more.
        </Text>
        <Text
          style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 8px" }}
        >
          2. Schedule your follow-ups
        </Text>
        <Text style={{ ...emailStyles.mutedText, margin: "0 0 16px" }}>
          Use automatic sequences so you never forget to follow up.
        </Text>
        <Text
          style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 8px" }}
        >
          3. Track your analytics
        </Text>
        <Text style={{ ...emailStyles.mutedText, margin: "0" }}>
          Visualize your conversion funnel and response rate by platform.
        </Text>
      </Section>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button
          href={`${SiteConfig.prodUrl}/app`}
          style={emailStyles.primaryButton}
        >
          Open my pipeline
        </Button>
      </Section>
      <Text
        style={{
          ...emailStyles.mutedText,
          lineHeight: "20px",
          marginTop: "16px",
        }}
      >
        See you soon,{"\n"}
        The {SiteConfig.title} team
      </Text>
    </EmailLayout>
  );
}
