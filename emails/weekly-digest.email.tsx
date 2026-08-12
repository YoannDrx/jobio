import { SiteConfig } from "@/site-config";
import {
  Button,
  Heading,
  Text,
  Preview,
  Section,
} from "@react-email/components";
import { EmailLayout } from "./utils/email-layout";
import { emailStyles } from "./utils/email-styles";

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
      <Heading as="h1" style={emailStyles.heading}>
        Ton résumé de la semaine
      </Heading>
      <Text style={emailStyles.bodyText}>Salut {name},</Text>
      <Section
        style={{
          ...emailStyles.card,
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
                  color: "#0891b2",
                  margin: "0",
                }}
              >
                {stats.missionsAdded}
              </Text>
              <Text
                style={{
                  ...emailStyles.mutedText,
                  fontSize: "12px",
                  margin: "0",
                }}
              >
                missions ajoutées
              </Text>
            </td>
            <td style={{ textAlign: "center", padding: "8px" }}>
              <Text
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#0891b2",
                  margin: "0",
                }}
              >
                {stats.followUpsCompleted}
              </Text>
              <Text
                style={{
                  ...emailStyles.mutedText,
                  fontSize: "12px",
                  margin: "0",
                }}
              >
                relances faites
              </Text>
            </td>
            <td style={{ textAlign: "center", padding: "8px" }}>
              <Text
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#0891b2",
                  margin: "0",
                }}
              >
                {stats.emailsSent}
              </Text>
              <Text
                style={{
                  ...emailStyles.mutedText,
                  fontSize: "12px",
                  margin: "0",
                }}
              >
                emails envoyés
              </Text>
            </td>
          </tr>
        </table>
      </Section>
      {topMissions.length > 0 && (
        <Section
          style={{
            ...emailStyles.card,
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
          style={emailStyles.primaryButton}
        >
          Ouvrir mon tableau de bord
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
    </EmailLayout>
  );
}
