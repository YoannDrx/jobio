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

type WeeklyDigestEmailProps = {
  name: string;
  stats: {
    missionsAdded: number;
    followUpsCompleted: number;
    emailsSent: number;
  };
  topMissions: {
    title: string;
    status: string;
  }[];
};

export default function WeeklyDigestEmail({
  name = "Freelance",
  stats = { missionsAdded: 0, followUpsCompleted: 0, emailsSent: 0 },
  topMissions = [],
}: WeeklyDigestEmailProps) {
  return (
    <EmailLayout>
      <Preview>Ton résumé de la semaine sur {SiteConfig.title}</Preview>
      <Heading as="h1" style={{ fontSize: "24px", fontWeight: "bold" }}>
        Ton résumé de la semaine
      </Heading>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        Salut {name},
      </Text>
      <Section
        style={{
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
          padding: "16px",
          margin: "16px 0",
        }}
      >
        <table cellPadding={0} cellSpacing={0} style={{ width: "100%" }}>
          <tr>
            <td style={{ textAlign: "center", padding: "8px" }}>
              <Text
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: SiteConfig.brand.primary,
                  margin: "0",
                }}
              >
                {stats.missionsAdded}
              </Text>
              <Text style={{ fontSize: "12px", color: "#64748B", margin: "0" }}>
                missions ajoutées
              </Text>
            </td>
            <td style={{ textAlign: "center", padding: "8px" }}>
              <Text
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: SiteConfig.brand.primary,
                  margin: "0",
                }}
              >
                {stats.followUpsCompleted}
              </Text>
              <Text style={{ fontSize: "12px", color: "#64748B", margin: "0" }}>
                relances faites
              </Text>
            </td>
            <td style={{ textAlign: "center", padding: "8px" }}>
              <Text
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: SiteConfig.brand.primary,
                  margin: "0",
                }}
              >
                {stats.emailsSent}
              </Text>
              <Text style={{ fontSize: "12px", color: "#64748B", margin: "0" }}>
                emails envoyés
              </Text>
            </td>
          </tr>
        </table>
      </Section>
      {topMissions.length > 0 && (
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
            Top missions
          </Text>
          {topMissions.map((mission, index) => (
            <Text
              key={index}
              style={{
                fontSize: "14px",
                lineHeight: "20px",
                margin: index === 0 ? "0" : "8px 0 0",
              }}
            >
              <strong>{mission.title}</strong>
              <span style={{ color: "#64748B" }}> · {mission.status}</span>
            </Text>
          ))}
        </Section>
      )}
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
          Ouvrir mon dashboard
        </Button>
      </Section>
      <Text style={{ fontSize: "14px", lineHeight: "20px", marginTop: "24px" }}>
        À bientôt,{"\n"}L{"'"}équipe {SiteConfig.title}
      </Text>

      <BilingualDivider />

      <Heading as="h1" style={{ fontSize: "24px", fontWeight: "bold" }}>
        Your weekly summary
      </Heading>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>Hi {name},</Text>
      <Section
        style={{
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
          padding: "16px",
          margin: "16px 0",
        }}
      >
        <table cellPadding={0} cellSpacing={0} style={{ width: "100%" }}>
          <tr>
            <td style={{ textAlign: "center", padding: "8px" }}>
              <Text
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: SiteConfig.brand.primary,
                  margin: "0",
                }}
              >
                {stats.missionsAdded}
              </Text>
              <Text style={{ fontSize: "12px", color: "#64748B", margin: "0" }}>
                missions added
              </Text>
            </td>
            <td style={{ textAlign: "center", padding: "8px" }}>
              <Text
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: SiteConfig.brand.primary,
                  margin: "0",
                }}
              >
                {stats.followUpsCompleted}
              </Text>
              <Text style={{ fontSize: "12px", color: "#64748B", margin: "0" }}>
                follow-ups done
              </Text>
            </td>
            <td style={{ textAlign: "center", padding: "8px" }}>
              <Text
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: SiteConfig.brand.primary,
                  margin: "0",
                }}
              >
                {stats.emailsSent}
              </Text>
              <Text style={{ fontSize: "12px", color: "#64748B", margin: "0" }}>
                emails sent
              </Text>
            </td>
          </tr>
        </table>
      </Section>
      {topMissions.length > 0 && (
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
            Top missions
          </Text>
          {topMissions.map((mission, index) => (
            <Text
              key={index}
              style={{
                fontSize: "14px",
                lineHeight: "20px",
                margin: index === 0 ? "0" : "8px 0 0",
              }}
            >
              <strong>{mission.title}</strong>
              <span style={{ color: "#64748B" }}> · {mission.status}</span>
            </Text>
          ))}
        </Section>
      )}
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
          Open my dashboard
        </Button>
      </Section>
      <Text style={{ fontSize: "14px", lineHeight: "20px", marginTop: "24px" }}>
        See you soon,{"\n"}
        The {SiteConfig.title} team
      </Text>
    </EmailLayout>
  );
}
