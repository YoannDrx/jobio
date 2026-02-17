import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contactSupportAction } from "@/features/contact/support/contact-support.action";
import { ContactSupportSchema } from "@/features/contact/support/contact-support.schema";
import { PublicPageShell, PublicSection } from "@/features/layout/public-page-shell";
import { env } from "@/lib/env";
import { buildMarketingMetadata } from "@/lib/seo";
import { serverToast } from "@/lib/server-toast";
import { SiteConfig } from "@/site-config";
import { Clock3, Headphones, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = buildMarketingMetadata({
  title: `Contact | ${SiteConfig.title}`,
  description:
    "Une question produit, un bug ou une idée d'amélioration ? Contacte directement l'équipe Jobio.",
  path: "/contact",
});

const contactTopics = [
  {
    icon: Wrench,
    title: "Support technique",
    details: "Bug, erreur API, comportement inattendu, problème de connexion.",
  },
  {
    icon: Headphones,
    title: "Aide produit",
    details: "Mise en place du workflow, optimisation de ton pipeline et relances.",
  },
  {
    icon: Sparkles,
    title: "Feedback & idées",
    details: "Proposition de feature, friction UX, besoin métier spécifique.",
  },
  {
    icon: ShieldCheck,
    title: "Confiance & données",
    details: "Questions RGPD, sécurité, export ou suppression de données.",
  },
];

export default function ContactPage() {
  return (
    <PublicPageShell
      badge="Contact"
      title="Parlons de ton usage réel de Jobio."
      description="Si quelque chose te freine dans ta prospection, écris-nous. On préfère des retours concrets terrain à des retours génériques."
      highlights={[
        "Support orienté résolution",
        "Canal direct équipe produit",
        "Réponse rapide en jours ouvrés",
      ]}
    >
      <div className="grid w-full gap-4 lg:grid-cols-3">
        <PublicSection
          title="Comment on peut t'aider"
          description="Choisis le sujet le plus proche de ton besoin."
          className="lg:col-span-2"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {contactTopics.map((topic) => (
              <div key={topic.title} className="rounded-xl border p-4">
                <div className="mb-2 flex items-center gap-2">
                  <topic.icon className="text-primary size-4" />
                  <p className="font-medium">{topic.title}</p>
                </div>
                <p className="text-muted-foreground text-sm">{topic.details}</p>
              </div>
            ))}
          </div>
        </PublicSection>

        <PublicSection title="Infos de contact" description="Canaux officiels">
          <div className="space-y-3 text-sm">
            <p className="font-medium">{env.NEXT_PUBLIC_EMAIL_CONTACT}</p>
            <div className="text-muted-foreground flex items-center gap-2">
              <Clock3 className="size-4" />
              Lun - Ven, 9h - 18h (Europe/Paris)
            </div>
            <Badge variant="secondary" className="w-fit">
              SLA cible: moins de 24h ouvrées
            </Badge>
          </div>
        </PublicSection>
      </div>

      <PublicSection
        title="Envoyer un message"
        description="On lit tout. Plus ton contexte est précis, plus la réponse sera utile."
      >
        <form
          action={async (formData) => {
            "use server";

            const result = ContactSupportSchema.safeParse({
              firstname: formData.get("first-name"),
              lastname: formData.get("last-name"),
              email: formData.get("email"),
              subject: formData.get("subject"),
              message: formData.get("message"),
            });

            if (!result.success) {
              await serverToast("Merci de vérifier les champs du formulaire", "error");
              return;
            }

            await contactSupportAction(result.data);
            await serverToast("Message envoyé. On revient vers toi rapidement.", "success");
          }}
          className="grid gap-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="first-name">Prénom</Label>
              <Input id="first-name" name="first-name" type="text" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last-name">Nom</Label>
              <Input id="last-name" name="last-name" type="text" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subject">Sujet</Label>
            <Input
              id="subject"
              name="subject"
              type="text"
              placeholder="Ex: erreur lors de l'import mission"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              rows={6}
              placeholder="Décris le contexte, ce que tu attends, et les étapes déjà testées."
              required
            />
          </div>

          <div className="flex items-center justify-end">
            <Button type="submit">Envoyer le message</Button>
          </div>
        </form>
      </PublicSection>
    </PublicPageShell>
  );
}
