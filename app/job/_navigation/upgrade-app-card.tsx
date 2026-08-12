import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BILLING_URL } from "@/lib/LINKS";
import { useHydrated } from "@/hooks/use-hydrated";
import Link from "next/link";
import { useCurrentUser } from "./use-current-user";

export const UpgradeCard = () => {
  const isHydrated = useHydrated();
  const { user, isLoading } = useCurrentUser();

  if (!isHydrated) return null;
  if (!user) return null;
  if (isLoading) return null;

  const plan = user.subscription.plan;
  if (plan === "pro") return null;

  const nextPlanLabel = "Pro";
  const subtitle =
    "Débloque le Coach CV, les automatisations et des limites étendues.";

  return (
    <Card className="">
      <CardHeader className="">
        <CardTitle>Passe en {nextPlanLabel}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="">
        <Link
          href={BILLING_URL}
          className={buttonVariants({ className: "w-full" })}
        >
          Voir le plan {nextPlanLabel}
        </Link>
      </CardContent>
    </Card>
  );
};
