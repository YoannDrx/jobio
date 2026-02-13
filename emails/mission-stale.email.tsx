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
      <Heading as="h1" style={{ fontSize: "24px", fontWeight: "bold" }}>
        Missions à mettre à jour
      </Heading>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        Salut {name},
      </Text>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        Ces missions n{"'"}ont pas été mises à jour depuis plus de 14 jours :
      </Text>
      <Section
        style={{
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
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
          Mettre à jour
        </Button>
      </Section>
      <Text style={{ fontSize: "14px", lineHeight: "20px", marginTop: "24px" }}>
        À bientôt,{"\n"}L{"'"}équipe {SiteConfig.title}
      </Text>

      <BilingualDivider />

      <Heading as="h1" style={{ fontSize: "24px", fontWeight: "bold" }}>
        Missions to update
      </Heading>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>Hi {name},</Text>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        These missions haven{"'"}t been updated in over 14 days:
      </Text>
      <Section
        style={{
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
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
          Update now
        </Button>
      </Section>
      <Text style={{ fontSize: "14px", lineHeight: "20px", marginTop: "24px" }}>
        See you soon,{"\n"}
        The {SiteConfig.title} team
      </Text>
    </EmailLayout>
  );
}
