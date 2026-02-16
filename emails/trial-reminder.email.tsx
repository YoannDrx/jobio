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
      <Heading as="h1" style={emailStyles.heading}>
        Une semaine avec {SiteConfig.title}
      </Heading>
      <Text style={emailStyles.bodyText}>Salut {name},</Text>
      <Text style={emailStyles.bodyText}>
        Voici ce que tu as accomplí cette semaine :
      </Text>
      <Section
        style={{
          ...emailStyles.card,
          padding: "16px",
          margin: "16px 0",
        }}
      >
        <Text
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: "#0891b2",
            margin: "0",
          }}
        >
          {missionsCount}
        </Text>
        <Text style={emailStyles.mutedText}>missions suivies</Text>
        <Text
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: "#0891b2",
            margin: "16px 0 0",
          }}
        >
          {followUpsCount}
        </Text>
        <Text style={emailStyles.mutedText}>relances effectuées</Text>
      </Section>
      <Text style={emailStyles.bodyText}>
        Continue sur ta lancée ! Passe en Pro pour débloquer toutes les
        fonctionnalités.
      </Text>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button
          href={`${SiteConfig.prodUrl}/app`}
          style={emailStyles.primaryButton}
        >
          Voir mon pipeline
        </Button>
      </Section>
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
        One week with {SiteConfig.title}
      </Heading>
      <Text style={emailStyles.bodyText}>Hi {name},</Text>
      <Text style={emailStyles.bodyText}>
        Here{"'"}s what you accomplished this week:
      </Text>
      <Section
        style={{
          ...emailStyles.card,
          padding: "16px",
          margin: "16px 0",
        }}
      >
        <Text
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: "#0891b2",
            margin: "0",
          }}
        >
          {missionsCount}
        </Text>
        <Text style={emailStyles.mutedText}>missions tracked</Text>
        <Text
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: "#0891b2",
            margin: "16px 0 0",
          }}
        >
          {followUpsCount}
        </Text>
        <Text style={emailStyles.mutedText}>follow-ups completed</Text>
      </Section>
      <Text style={emailStyles.bodyText}>
        Keep up the momentum! Upgrade to Pro to unlock all features.
      </Text>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button
          href={`${SiteConfig.prodUrl}/app`}
          style={emailStyles.primaryButton}
        >
          View my pipeline
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
