import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { SiteConfig } from "@/site-config";
import { CheckCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: `Compte supprimé | ${SiteConfig.title}`,
  description: "Ton compte Jobio et les données associées ont été supprimés.",
};

export default function GoodbyePage() {
  return (
    <Card className="mx-auto w-full max-w-md lg:max-w-lg lg:p-6">
      <CardHeader>
        <div className="flex justify-center">
          <Avatar className="size-16">
            <AvatarFallback>
              <CheckCircle />
            </AvatarFallback>
          </Avatar>
        </div>
        <CardHeader className="text-center">Compte supprimé</CardHeader>

        <CardDescription className="text-center">
          Ton compte a bien été supprimé. Nous sommes désolés de te voir partir.
        </CardDescription>
      </CardHeader>
      <CardFooter className="border-t pt-6">
        <div className="w-full space-y-4 text-center">
          <p className="text-muted-foreground text-sm">
            Ton compte et toutes les données associées ont été définitivement
            supprimés de notre système.
          </p>
          <p className="text-muted-foreground text-sm">
            Si tu changes d&apos;avis, tu pourras recréer un compte à tout
            moment.
          </p>
          <Button asChild className="w-full">
            <Link href="/auth/signup">Créer un nouveau compte</Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
