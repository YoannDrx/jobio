import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import { Typography } from "../../components/nowts/typography";
import { ContactSupportDialog } from "../contact/support/contact-support-dialog";

type Error401Props = PropsWithChildren<{
  title?: string;
}>;

export function Error401(props: Error401Props) {
  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="flex flex-col">
        <Typography variant="code">401</Typography>
        <CardTitle>{props.title ?? "Accès non autorisé"}</CardTitle>
        <CardDescription>
          Tu n’as pas l’autorisation d’accéder à cette ressource. Connecte-toi
          ou contacte le support si tu penses qu’il s’agit d’une erreur.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex flex-row gap-2">
        <ContactSupportDialog />
        <Button asChild>
          <Link href="/auth/signin">Se connecter</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
