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

type BillingInvoiceIssuedEmailProps = {
  freelancerName: string;
  clientName: string;
  invoiceNumber: string;
  totalFormatted: string;
  dueDate: string;
  invoiceUrl: string;
};

export default function BillingInvoiceIssuedEmail({
  freelancerName = "Freelancer",
  clientName = "Client",
  invoiceNumber = "001",
  totalFormatted = "0,00 €",
  dueDate = "",
  invoiceUrl = "",
}: BillingInvoiceIssuedEmailProps) {
  return (
    <EmailLayout>
      <Preview>
        {freelancerName} vous a envoyé une facture sur {SiteConfig.title}
      </Preview>
      <Heading as="h1" style={emailStyles.heading}>
        Facture émise
      </Heading>
      <Text style={emailStyles.bodyText}>Bonjour {clientName},</Text>
      <Text style={emailStyles.bodyText}>
        {freelancerName} vous a envoyé la facture{" "}
        <strong>{invoiceNumber}</strong> d{"'"}un montant de{" "}
        <strong>{totalFormatted}</strong>, à régler avant le{" "}
        <strong>{dueDate}</strong>.
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
