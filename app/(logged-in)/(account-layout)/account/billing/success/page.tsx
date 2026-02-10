import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { combineWithParentMetadata } from "@/lib/metadata";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export const generateMetadata = combineWithParentMetadata({
  title: "Abonnement réussi",
  description: "Votre abonnement a été activé avec succès.",
});

export default async function SubscriptionSuccessPage() {
  await getRequiredUser();

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Abonnement réussi !</CardTitle>
          <CardDescription>
            Merci d&apos;avoir mis à niveau votre abonnement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-center gap-4 pt-4">
              <Button asChild>
                <Link href="/account/billing">Gérer l&apos;abonnement</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/app">Aller au tableau de bord</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
