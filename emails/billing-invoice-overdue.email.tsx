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

type BillingInvoiceOverdueEmailProps = {
  freelancerName: string;
  clientName: string;
  invoiceNumber: string;
  totalFormatted: string;
  daysOverdue: number;
  invoiceUrl: string;
};

export default function BillingInvoiceOverdueEmail({
  freelancerName = "Freelancer",
  clientName = "Client",
  invoiceNumber = "001",
  totalFormatted = "0,00 €",
  daysOverdue = 0,
  invoiceUrl = "",
}: BillingInvoiceOverdueEmailProps) {
  return (
    <EmailLayout>
      <Preview>
        Facture {invoiceNumber} en retard de paiement sur {SiteConfig.title}
      </Preview>
      <Heading as="h1" style={emailStyles.heading}>
        Relance : Facture en retard
      </Heading>
      <Text style={emailStyles.bodyText}>Bonjour {clientName},</Text>
      <Text style={emailStyles.bodyText}>
        La facture <strong>{invoiceNumber}</strong> de {freelancerName} est en
        retard de paiement de{" "}
        <strong>
          {daysOverdue} jour{daysOverdue > 1 ? "s" : ""}
        </strong>
        . Montant : <strong>{totalFormatted}</strong>.
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
        À bientôt,{"\n"}L{"'"}équipe {SiteConfig.title}
      </Text>
    </EmailLayout>
  );
}
