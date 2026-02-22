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
  const { user, isLoading } = useCurrentUser();

  if (!user) return null;
  if (isLoading) return null;

  const plan = user.subscription.plan;
  if (plan === "ultra") return null;

  const nextPlanLabel = plan === "free" ? "Pro" : "Ultra";
  const subtitle =
    plan === "free"
      ? "Débloque l'export CSV, plus de limites et l'IA avancée."
      : "Débloque le CV Coach IA, les séquences illimitées et le support chat.";

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
