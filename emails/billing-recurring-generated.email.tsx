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

type BillingRecurringGeneratedEmailProps = {
  freelancerName: string;
  recurringName: string;
  clientName: string;
  totalFormatted: string;
  invoicesUrl: string;
};

export default function BillingRecurringGeneratedEmail({
  freelancerName = "Freelancer",
  recurringName = "Récurrence",
  clientName = "Client",
  totalFormatted = "0,00 €",
  invoicesUrl = "",
}: BillingRecurringGeneratedEmailProps) {
  return (
    <EmailLayout>
      <Preview>
        Facture récurrente "{recurringName}" générée sur {SiteConfig.title}
      </Preview>
      <Heading as="h1" style={emailStyles.heading}>
        Facture récurrente générée
      </Heading>
      <Text style={emailStyles.bodyText}>Bonjour {freelancerName},</Text>
      <Text style={emailStyles.bodyText}>
        Une facture brouillon a été automatiquement créée depuis votre
        récurrence <strong>{recurringName}</strong> pour le client{" "}
        <strong>{clientName}</strong>. Montant :{" "}
        <strong>{totalFormatted}</strong>.
      </Text>
      <Text style={emailStyles.bodyText}>
        Vérifiez et émettez la facture depuis votre espace facturation.
      </Text>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button href={invoicesUrl} style={emailStyles.primaryButton}>
          Voir mes factures
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
