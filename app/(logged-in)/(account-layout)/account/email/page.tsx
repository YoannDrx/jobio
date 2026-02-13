import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ContactSupportDialog } from "@/features/contact/support/contact-support-dialog";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { env } from "@/lib/env";
import { resend } from "@/lib/mail/resend";
import { combineWithParentMetadata } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import { AccountLayout } from "../account-layout";
import { ToggleEmailCheckbox } from "./toggle-email-checkbox";

export const generateMetadata = combineWithParentMetadata({
  title: "Email",
  description: "Gérer tes paramètres de notifications email.",
});

export default function Page() {
  return (
    <AccountLayout>
      <Suspense fallback={null}>
        <MailProfilePage />
      </Suspense>
    </AccountLayout>
  );
}

async function MailProfilePage() {
  const user = await getRequiredUser();
  const userWithResendContactId = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      resendContactId: true,
    },
  });

  if (!userWithResendContactId?.resendContactId) {
    return <ErrorComponent />;
  }

  if (!env.RESEND_AUDIENCE_ID) {
    return <ErrorComponent />;
  }

  const { data: resendUser } = await resend.contacts.get({
    audienceId: env.RESEND_AUDIENCE_ID,
    id: userWithResendContactId.resendContactId,
  });

  if (!resendUser) {
    return <ErrorComponent />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres email</CardTitle>
        <CardDescription>
          Configure tes paramètres de notifications email selon tes préférences.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ToggleEmailCheckbox unsubscribed={resendUser.unsubscribed} />
      </CardContent>
    </Card>
  );
}

const ErrorComponent = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact introuvable</CardTitle>
        <CardDescription>
          Nous n&apos;avons pas trouvé ton contact Resend. Contacte le support.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <ContactSupportDialog />
      </CardFooter>
    </Card>
  );
};
