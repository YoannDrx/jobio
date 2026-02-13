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

type FollowUpDueEmailProps = {
  name: string;
  followUps: {
    title: string;
    missionTitle: string;
    scheduledAt: string;
  }[];
};

export default function FollowUpDueEmail({
  name = "Freelance",
  followUps = [],
}: FollowUpDueEmailProps) {
  return (
    <EmailLayout>
      <Preview>Tes relances du jour sur {SiteConfig.title}</Preview>
      <Heading as="h1" style={{ fontSize: "24px", fontWeight: "bold" }}>
        Tes relances du jour
      </Heading>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        Salut {name},
      </Text>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        Tu as {followUps.length} relance{followUps.length > 1 ? "s" : ""} prévue
        {followUps.length > 1 ? "s" : ""} aujourd{"'"}hui :
      </Text>
      <Section
        style={{
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
          padding: "16px",
          margin: "16px 0",
        }}
      >
        {followUps.map((followUp, index) => (
          <Text
            key={index}
            style={{
              fontSize: "14px",
              lineHeight: "20px",
              margin: index === 0 ? "0" : "12px 0 0",
            }}
          >
            <strong>{followUp.title}</strong>
            {" — "}
            <span style={{ color: "#64748B" }}>
              {followUp.missionTitle} · {followUp.scheduledAt}
            </span>
          </Text>
        ))}
      </Section>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button
          href={`${SiteConfig.prodUrl}/app/follow-ups`}
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
          Voir mes relances
        </Button>
      </Section>
      <Text style={{ fontSize: "14px", lineHeight: "20px", marginTop: "24px" }}>
        À bientôt,{"\n"}L{"'"}équipe {SiteConfig.title}
      </Text>

      <BilingualDivider />

      <Heading as="h1" style={{ fontSize: "24px", fontWeight: "bold" }}>
        Your follow-ups for today
      </Heading>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>Hi {name},</Text>
      <Text style={{ fontSize: "16px", lineHeight: "24px" }}>
        You have {followUps.length} follow-up{followUps.length > 1 ? "s" : ""}{" "}
        scheduled for today:
      </Text>
      <Section
        style={{
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
          padding: "16px",
          margin: "16px 0",
        }}
      >
        {followUps.map((followUp, index) => (
          <Text
            key={index}
            style={{
              fontSize: "14px",
              lineHeight: "20px",
              margin: index === 0 ? "0" : "12px 0 0",
            }}
          >
            <strong>{followUp.title}</strong>
            {" — "}
            <span style={{ color: "#64748B" }}>
              {followUp.missionTitle} · {followUp.scheduledAt}
            </span>
          </Text>
        ))}
      </Section>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button
          href={`${SiteConfig.prodUrl}/app/follow-ups`}
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
          View my follow-ups
        </Button>
      </Section>
      <Text style={{ fontSize: "14px", lineHeight: "20px", marginTop: "24px" }}>
        See you soon,{"\n"}
        The {SiteConfig.title} team
      </Text>
    </EmailLayout>
  );
}
