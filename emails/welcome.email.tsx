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

type WelcomeEmailProps = {
  name: string;
};

export default function WelcomeEmail({
  name = "Freelance",
}: WelcomeEmailProps) {
  return (
    <EmailLayout>
      <Preview>Bienvenue sur {SiteConfig.title} !</Preview>
      <Heading
        as="h1"
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          color: SiteConfig.brand.primary,
        }}
      >
        Bienvenue sur {SiteConfig.title} !
      </Heading>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        Salut {name},
      </Text>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        Ton compte Jobio est prêt. Voici comment démarrer en 3 étapes :
      </Text>
      <Section>
        <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
          <strong>1.</strong> Crée ton profil freelance (compétences, TJM cible)
          {"\n"}
          <strong>2.</strong> Sélectionne tes plateformes (Malt, Comet,
          LinkedIn...){"\n"}
          <strong>3.</strong> Capture ta première mission (colle une URL ou du
          texte)
        </Text>
      </Section>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button
          href={`${SiteConfig.prodUrl}/app`}
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
          Commencer maintenant
        </Button>
      </Section>
      <Text style={{ fontSize: "14px", color: "#64748B", marginTop: "32px" }}>
        15 missions gratuites · 2 profils · 5 requêtes IA/mois
      </Text>
      <Text style={{ fontSize: "14px", lineHeight: "20px", marginTop: "16px" }}>
        À bientôt,{"\n"}
        L'équipe {SiteConfig.title}
      </Text>

      <BilingualDivider />

      <Heading
        as="h1"
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          color: SiteConfig.brand.primary,
        }}
      >
        Welcome to {SiteConfig.title}!
      </Heading>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>Hi {name},</Text>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        Your Jobio account is ready. Here{"'"}s how to get started in 3 steps:
      </Text>
      <Section>
        <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
          <strong>1.</strong> Create your freelance profile (skills, target
          rate)
          {"\n"}
          <strong>2.</strong> Select your platforms (Malt, Comet, LinkedIn...)
          {"\n"}
          <strong>3.</strong> Capture your first mission (paste a URL or text)
        </Text>
      </Section>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button
          href={`${SiteConfig.prodUrl}/app`}
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
          Get started now
        </Button>
      </Section>
      <Text style={{ fontSize: "14px", color: "#64748B", marginTop: "32px" }}>
        15 free missions · 2 profiles · 5 AI requests/month
      </Text>
      <Text style={{ fontSize: "14px", lineHeight: "20px", marginTop: "16px" }}>
        See you soon,{"\n"}
        The {SiteConfig.title} team
      </Text>
    </EmailLayout>
  );
}
