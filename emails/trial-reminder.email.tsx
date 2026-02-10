import { SiteConfig } from "@/site-config";
import {
  Button,
  Heading,
  Text,
  Preview,
  Section,
} from "@react-email/components";
import { EmailLayout } from "./utils/email-layout";

type TrialReminderEmailProps = {
  name: string;
  missionsCount: number;
  followUpsCount: number;
};

export default function TrialReminderEmail({
  name = "Freelance",
  missionsCount = 0,
  followUpsCount = 0,
}: TrialReminderEmailProps) {
  return (
    <EmailLayout>
      <Preview>
        Ça fait une semaine que tu utilises {SiteConfig.title} !
      </Preview>
      <Heading as="h1" style={{ fontSize: "24px", fontWeight: "bold" }}>
        Une semaine avec {SiteConfig.title}
      </Heading>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        Salut {name},
      </Text>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        Voici ce que tu as accomplí cette semaine :
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
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: "#22D3EE",
            margin: "0",
          }}
        >
          {missionsCount}
        </Text>
        <Text style={{ fontSize: "14px", color: "#64748B", margin: "0" }}>
          missions suivies
        </Text>
        <Text
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: "#22D3EE",
            margin: "16px 0 0",
          }}
        >
          {followUpsCount}
        </Text>
        <Text style={{ fontSize: "14px", color: "#64748B", margin: "0" }}>
          relances effectuées
        </Text>
      </Section>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        Continue sur ta lancée ! Passe en Pro pour débloquer toutes les
        fonctionnalités.
      </Text>
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
          Voir mon pipeline
        </Button>
      </Section>
      <Text style={{ fontSize: "14px", lineHeight: "20px", marginTop: "24px" }}>
        À bientôt,{"\n"}
        L'équipe {SiteConfig.title}
      </Text>
    </EmailLayout>
  );
}
