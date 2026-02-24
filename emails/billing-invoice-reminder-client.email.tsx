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

type BillingInvoiceReminderClientEmailProps = {
  clientName: string;
  freelancerName: string;
  invoiceNumber: string;
  totalFormatted: string;
  daysOverdue: number;
  invoiceUrl: string;
};

export default function BillingInvoiceReminderClientEmail({
  clientName = "Client",
  freelancerName = "Freelancer",
  invoiceNumber = "001",
  totalFormatted = "0,00 €",
  daysOverdue = 0,
  invoiceUrl = "",
}: BillingInvoiceReminderClientEmailProps) {
  return (
    <EmailLayout>
      <Preview>Rappel de paiement - Facture {invoiceNumber}</Preview>
      <Heading as="h1" style={emailStyles.heading}>
        Rappel de paiement
      </Heading>
      <Text style={emailStyles.bodyText}>Bonjour {clientName},</Text>
      <Text style={emailStyles.bodyText}>
        Nous nous permettons de vous rappeler que la facture{" "}
        <strong>{invoiceNumber}</strong> émise par {freelancerName} d{"'"}un
        montant de <strong>{totalFormatted}</strong> est en attente de paiement
        depuis{" "}
        <strong>
          {daysOverdue} jour{daysOverdue > 1 ? "s" : ""}
        </strong>
        .
      </Text>
      <Text style={emailStyles.bodyText}>
        Si le paiement a déjà été effectué, veuillez ne pas tenir compte de ce
        rappel.
      </Text>
      <Section style={{ textAlign: "center", marginTop: "24px" }}>
        <Button href={invoiceUrl} style={emailStyles.primaryButton}>
          Voir la facture
        </Button>
      </Section>
      <Text
        style={{
          ...emailStyles.mutedText,
          lineHeight: "20px",
          marginTop: "16px",
        }}
      >
        Cordialement,{"\n"}
        {freelancerName} via {SiteConfig.title}
      </Text>
    </EmailLayout>
  );
}
