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
        <CardTitle>{props.title ?? "Unauthorized"}</CardTitle>
        <CardDescription>
          You don't have permission to access this resource. Please sign in or
          contact your administrator if you believe this is a mistake.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex flex-row gap-2">
        <ContactSupportDialog />
        <Button asChild>
          <Link href="/auth/signin">Sign in</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
