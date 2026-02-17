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

type MissionStaleEmailProps = {
  name: string;
  missions: {
    title: string;
    company: string | null;
    daysSinceUpdate: number;
  }[];
};

export default function MissionStaleEmail({
  name = "Freelance",
  missions = [],
}: MissionStaleEmailProps) {
  return (
    <EmailLayout>
      <Preview>Missions à mettre à jour sur {SiteConfig.title}</Preview>
      <Heading as="h1" style={emailStyles.heading}>
        Missions à mettre à jour
      </Heading>
      <Text style={emailStyles.bodyText}>Salut {name},</Text>
      <Text style={emailStyles.bodyText}>
        Ces missions n{"'"}ont pas été mises à jour depuis plus de 14 jours :
      </Text>
      <Section
        style={{
          ...emailStyles.card,
          padding: "16px",
          margin: "16px 0",
        }}
      >
        {missions.map((mission, index) => (
          <Text
            key={index}
            style={{
              fontSize: "14px",
              lineHeight: "20px",
              margin: index === 0 ? "0" : "12px 0 0",
            }}
          >
            <strong>{mission.title}</strong>
            {mission.company ? ` — ${mission.company}` : ""}
            <span style={{ color: "#64748B" }}>
              {" "}
              · {mission.daysSinceUpdate}j sans mise à jour
            </span>
          </Text>
        ))}
      </Section>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button
          href={`${SiteConfig.prodUrl}/app/pipeline`}
          style={emailStyles.primaryButton}
        >
          Mettre à jour
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
        Missions to update
      </Heading>
      <Text style={emailStyles.bodyText}>Hi {name},</Text>
      <Text style={emailStyles.bodyText}>
        These missions haven{"'"}t been updated in over 14 days:
      </Text>
      <Section
        style={{
          ...emailStyles.card,
          padding: "16px",
          margin: "16px 0",
        }}
      >
        {missions.map((mission, index) => (
          <Text
            key={index}
            style={{
              fontSize: "14px",
              lineHeight: "20px",
              margin: index === 0 ? "0" : "12px 0 0",
            }}
          >
            <strong>{mission.title}</strong>
            {mission.company ? ` — ${mission.company}` : ""}
            <span style={{ color: "#64748B" }}>
              {" "}
              · {mission.daysSinceUpdate}d without update
            </span>
          </Text>
        ))}
      </Section>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button
          href={`${SiteConfig.prodUrl}/app/pipeline`}
          style={emailStyles.primaryButton}
        >
          Update now
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
