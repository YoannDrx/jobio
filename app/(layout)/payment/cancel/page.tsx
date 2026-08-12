import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ContactSupportDialog } from "@/features/contact/support/contact-support-dialog";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import Link from "next/link";

export default function CancelPaymentPage() {
  return (
    <Layout className="mx-auto mt-0 max-w-7xl px-4 py-14 lg:px-8">
      <LayoutHeader>
        <Badge variant="outline">Paiement interrompu</Badge>
        <LayoutTitle>Le paiement n’a pas pu être finalisé</LayoutTitle>
        <LayoutDescription>
          Aucun débit n’est confirmé sur cette page. Vérifie tes informations de
          paiement puis réessaie. Si le problème persiste, contacte le support.
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent className="flex items-center gap-2">
        <Link href="/" className={buttonVariants({ variant: "invert" })}>
          Retour à l’accueil
        </Link>
        <ContactSupportDialog />
      </LayoutContent>
    </Layout>
  );
}
