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

type TrialEndingEmailProps = {
  name: string;
  daysLeft: number;
};

export default function TrialEndingEmail({
  name = "Freelance",
  daysLeft = 2,
}: TrialEndingEmailProps) {
  return (
    <EmailLayout>
      <Preview>{`Ton essai ${SiteConfig.title} se termine dans ${daysLeft} jours`}</Preview>
      <Heading as="h1" style={emailStyles.heading}>
        Ton essai se termine bientôt
      </Heading>
      <Text style={emailStyles.bodyText}>Salut {name},</Text>
      <Text style={emailStyles.bodyText}>
        Ton essai gratuit de {SiteConfig.title} se termine dans{" "}
        <strong>{daysLeft} jours</strong>.
      </Text>
      <Text style={emailStyles.bodyText}>
        Pour continuer à utiliser toutes les fonctionnalités sans interruption,
        passe en Pro :
      </Text>
      <Section
        style={{
          ...emailStyles.card,
          padding: "16px",
          margin: "16px 0",
        }}
      >
        <Text style={{ fontSize: "16px", fontWeight: "bold", margin: "0" }}>
          Plan Pro — 9,99€/mois
        </Text>
        <Text style={{ ...emailStyles.mutedText, margin: "4px 0 0" }}>
          Missions illimitées · 5 profils · 200 contacts · 50 requêtes IA/mois ·
          Analytics 90 jours
        </Text>
      </Section>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button
          href={`${SiteConfig.prodUrl}/account/billing`}
          style={emailStyles.primaryButton}
        >
          Passer en Pro
        </Button>
      </Section>
      <Text style={emailStyles.mutedText}>
        Pas prêt ? Le plan Free reste disponible avec 15 missions, 2 profils et
        5 requêtes IA/mois.
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
        Your trial is ending soon
      </Heading>
      <Text style={emailStyles.bodyText}>Hi {name},</Text>
      <Text style={emailStyles.bodyText}>
        Your free trial of {SiteConfig.title} ends in{" "}
        <strong>{daysLeft} days</strong>.
      </Text>
      <Text style={emailStyles.bodyText}>
        To keep using all features without interruption, upgrade to Pro:
      </Text>
      <Section
        style={{
          ...emailStyles.card,
          padding: "16px",
          margin: "16px 0",
        }}
      >
        <Text style={{ fontSize: "16px", fontWeight: "bold", margin: "0" }}>
          Pro Plan — 9.99€/month
        </Text>
        <Text style={{ ...emailStyles.mutedText, margin: "4px 0 0" }}>
          Unlimited missions · 5 profiles · 200 contacts · 50 AI requests/month
          · 90-day analytics
        </Text>
      </Section>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button
          href={`${SiteConfig.prodUrl}/account/billing`}
          style={emailStyles.primaryButton}
        >
          Upgrade to Pro
        </Button>
      </Section>
      <Text style={emailStyles.mutedText}>
        Not ready? The Free plan remains available with 15 missions, 2 profiles
        and 5 AI requests/month.
      </Text>
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
