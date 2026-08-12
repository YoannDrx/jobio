import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { combineWithParentMetadata } from "@/lib/metadata";
import { Download } from "lucide-react";
import { AccountLayout } from "../account-layout";

export const generateMetadata = combineWithParentMetadata({
  title: "Tes données",
  description: "Télécharger une copie portable des données de ton compte.",
});

export default function AccountDataPage() {
  return (
    <AccountLayout>
      <Card>
        <CardHeader>
          <CardTitle>Exporter tes données</CardTitle>
          <CardDescription>
            Télécharge une archive JSON de ton profil, tes missions, contacts,
            CV, usages IA, opportunités Radar et données de gestion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Les mots de passe, jetons de connexion et liens secrets sont
            volontairement expurgés de l&apos;archive.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild>
            <a href="/api/account/export" download>
              <Download />
              Télécharger mon export
            </a>
          </Button>
        </CardFooter>
      </Card>
    </AccountLayout>
  );
}
