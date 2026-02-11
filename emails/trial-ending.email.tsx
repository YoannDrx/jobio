import { SiteConfig } from "@/site-config";
import {
  Button,
  Heading,
  Text,
  Preview,
  Section,
} from "@react-email/components";
import { EmailLayout } from "./utils/email-layout";

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
      <Heading as="h1" style={{ fontSize: "24px", fontWeight: "bold" }}>
        Ton essai se termine bientôt
      </Heading>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        Salut {name},
      </Text>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        Ton essai gratuit de {SiteConfig.title} se termine dans{" "}
        <strong>{daysLeft} jours</strong>.
      </Text>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        Pour continuer à utiliser toutes les fonctionnalités sans interruption,
        passe en Pro :
      </Text>
      <Section
        style={{
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
          padding: "16px",
          margin: "16px 0",
        }}
      >
        <Text style={{ fontSize: "16px", fontWeight: "bold", margin: "0" }}>
          Plan Pro — 9,99€/mois
        </Text>
        <Text style={{ fontSize: "14px", color: "#64748B", margin: "4px 0 0" }}>
          Missions illimitées · 5 profils · 200 contacts · 50 requêtes IA/mois ·
          Analytics 90 jours
        </Text>
      </Section>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button
          href={`${SiteConfig.prodUrl}/account/billing`}
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
          Passer en Pro
        </Button>
      </Section>
      <Text style={{ fontSize: "14px", color: "#64748B", marginTop: "24px" }}>
        Pas prêt ? Le plan Free reste disponible avec 15 missions, 2 profils et
        5 requêtes IA/mois.
      </Text>
      <Text style={{ fontSize: "14px", lineHeight: "20px", marginTop: "16px" }}>
        À bientôt,{"\n"}
        L'équipe {SiteConfig.title}
      </Text>
    </EmailLayout>
  );
}
