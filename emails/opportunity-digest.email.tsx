import { SiteConfig } from "@/site-config";
import {
  Button,
  Heading,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { EmailLayout } from "./utils/email-layout";
import { emailStyles } from "./utils/email-styles";

type OpportunityDigestEmailProps = {
  name: string;
  opportunities: {
    title: string;
    company: string | null;
    score: number;
    source: string;
  }[];
};

export default function OpportunityDigestEmail({
  name,
  opportunities,
}: OpportunityDigestEmailProps) {
  return (
    <EmailLayout>
      <Preview>
        {`${opportunities.length} nouvelle(s) opportunité(s) qualifiée(s)`}
      </Preview>
      <Heading as="h1" style={emailStyles.heading}>
        Ton Radar Missions du jour
      </Heading>
      <Text style={emailStyles.bodyText}>Salut {name || "Freelance"},</Text>
      <Text style={emailStyles.bodyText}>
        Voici les meilleures opportunités détectées depuis le dernier passage.
        Elles ne seront ajoutées au pipeline qu’après ta validation.
      </Text>
      <Section
        style={{ ...emailStyles.card, padding: "16px", margin: "16px 0" }}
      >
        {opportunities.map((opportunity, index) => (
          <Text
            key={`${opportunity.title}-${index}`}
            style={{
              fontSize: "14px",
              lineHeight: "20px",
              margin: index === 0 ? "0" : "12px 0 0",
            }}
          >
            <strong>{opportunity.title}</strong>
            <br />
            <span style={{ color: "#64748B" }}>
              {opportunity.company ?? "Entreprise non renseignée"} · score{" "}
              {opportunity.score}/100 · {opportunity.source}
            </span>
          </Text>
        ))}
      </Section>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button
          href={`${SiteConfig.prodUrl}/job/opportunities`}
          style={emailStyles.primaryButton}
        >
          Examiner les opportunités
        </Button>
      </Section>
      <Text
        style={{
          ...emailStyles.mutedText,
          lineHeight: "20px",
          marginTop: "16px",
        }}
      >
        Tu peux désactiver ce digest depuis Radar Missions.
      </Text>
    </EmailLayout>
  );
}
