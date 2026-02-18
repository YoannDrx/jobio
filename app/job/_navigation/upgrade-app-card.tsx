import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BILLING_URL } from "@/lib/LINKS";
import Link from "next/link";
import { useCurrentUser } from "./use-current-user";

export const UpgradeCard = () => {
  const user = useCurrentUser();

  if (!user) return null;

  return (
    <Card className="">
      <CardHeader className="">
        <CardTitle>Passe en PRO</CardTitle>
        <CardDescription>
          Débloque les limites avancées et accélère ta prospection.
        </CardDescription>
      </CardHeader>
      <CardContent className="">
        <Link
          href={BILLING_URL}
          className={buttonVariants({ className: "w-full" })}
        >
          Voir les plans
        </Link>
      </CardContent>
    </Card>
  );
};
