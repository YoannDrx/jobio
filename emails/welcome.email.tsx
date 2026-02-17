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

type WelcomeEmailProps = {
  name: string;
};

export default function WelcomeEmail({
  name = "Freelance",
}: WelcomeEmailProps) {
  return (
    <EmailLayout>
      <Preview>Bienvenue sur {SiteConfig.title} !</Preview>
      <Heading as="h1" style={emailStyles.heading}>
        Bienvenue sur {SiteConfig.title} !
      </Heading>
      <Text style={emailStyles.bodyText}>Salut {name},</Text>
      <Text style={emailStyles.bodyText}>
        Ton compte Jobio est prêt. Voici comment démarrer en 3 étapes :
      </Text>
      <Section style={emailStyles.card}>
        <Text style={{ ...emailStyles.bodyText, margin: "0 0 8px" }}>
          <strong>1.</strong> Crée ton profil freelance (compétences, TJM cible)
        </Text>
        <Text style={{ ...emailStyles.bodyText, margin: "0 0 8px" }}>
          <strong>2.</strong> Sélectionne tes plateformes (Malt, Comet,
          LinkedIn...)
        </Text>
        <Text style={{ ...emailStyles.bodyText, margin: "0" }}>
          <strong>3.</strong> Capture ta première mission (colle une URL ou du
          texte)
        </Text>
      </Section>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button
          href={`${SiteConfig.prodUrl}/app`}
          style={emailStyles.primaryButton}
        >
          Commencer maintenant
        </Button>
      </Section>
      <Text style={{ ...emailStyles.mutedText, marginTop: "32px" }}>
        15 missions gratuites · 2 profils · 5 requêtes IA/mois
      </Text>
      <Text
        style={{
          ...emailStyles.mutedText,
          lineHeight: "20px",
          marginTop: "16px",
        }}
      >
        À bientôt,{"\n"}
        L'équipe {SiteConfig.title}
      </Text>

      <BilingualDivider />

      <Heading as="h1" style={emailStyles.heading}>
        Welcome to {SiteConfig.title}!
      </Heading>
      <Text style={emailStyles.bodyText}>Hi {name},</Text>
      <Text style={emailStyles.bodyText}>
        Your Jobio account is ready. Here{"'"}s how to get started in 3 steps:
      </Text>
      <Section style={emailStyles.card}>
        <Text style={{ ...emailStyles.bodyText, margin: "0 0 8px" }}>
          <strong>1.</strong> Create your freelance profile (skills, target
          rate)
        </Text>
        <Text style={{ ...emailStyles.bodyText, margin: "0 0 8px" }}>
          <strong>2.</strong> Select your platforms (Malt, Comet, LinkedIn...)
        </Text>
        <Text style={{ ...emailStyles.bodyText, margin: "0" }}>
          <strong>3.</strong> Capture your first mission (paste a URL or text)
        </Text>
      </Section>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button
          href={`${SiteConfig.prodUrl}/app`}
          style={emailStyles.primaryButton}
        >
          Get started now
        </Button>
      </Section>
      <Text style={{ ...emailStyles.mutedText, marginTop: "32px" }}>
        15 free missions · 2 profiles · 5 AI requests/month
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
