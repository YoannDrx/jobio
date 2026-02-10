import { SiteConfig } from "@/site-config";
import {
  Button,
  Heading,
  Text,
  Preview,
  Section,
} from "@react-email/components";
import { EmailLayout } from "./utils/email-layout";

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
      <Heading as="h1" style={{ fontSize: "24px", fontWeight: "bold" }}>
        3 astuces pour tirer le max de {SiteConfig.title}
      </Heading>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        Salut {name},
      </Text>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        Tu utilises {SiteConfig.title} depuis 3 jours. Voici comment en profiter
        au maximum :
      </Text>
      <Section
        style={{
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
          padding: "16px",
          margin: "16px 0",
        }}
      >
        <Text
          style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 8px" }}
        >
          1. Colle directement une URL d&apos;annonce
        </Text>
        <Text
          style={{ fontSize: "14px", color: "#64748B", margin: "0 0 16px" }}
        >
          L&apos;IA extrait automatiquement le titre, le TJM, la stack et plus
          encore.
        </Text>
        <Text
          style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 8px" }}
        >
          2. Planifie tes relances
        </Text>
        <Text
          style={{ fontSize: "14px", color: "#64748B", margin: "0 0 16px" }}
        >
          Utilise les séquences automatiques pour ne jamais oublier de relancer.
        </Text>
        <Text
          style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 8px" }}
        >
          3. Suis tes analytics
        </Text>
        <Text style={{ fontSize: "14px", color: "#64748B", margin: "0" }}>
          Visualise ton entonnoir de conversion et ton taux de réponse par
          plateforme.
        </Text>
      </Section>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button
          href={`${SiteConfig.prodUrl}/app`}
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
          Ouvrir mon pipeline
        </Button>
      </Section>
      <Text style={{ fontSize: "14px", lineHeight: "20px", marginTop: "24px" }}>
        À bientôt,{"\n"}
        L&apos;équipe {SiteConfig.title}
      </Text>
    </EmailLayout>
  );
}
