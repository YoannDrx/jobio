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
        <CardTitle>Upgrade to PRO</CardTitle>
        <CardDescription>
          Unlock all features and get unlimited access to our app.
        </CardDescription>
      </CardHeader>
      <CardContent className="">
        <Link
          href={BILLING_URL}
          className={buttonVariants({ className: "w-full" })}
        >
          Upgrade
        </Link>
      </CardContent>
    </Card>
  );
};
