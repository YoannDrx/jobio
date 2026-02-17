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
import { combineWithParentMetadata } from "@/lib/metadata";
import { resend } from "@/lib/mail/resend";
import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import { AccountLayout } from "../account-layout";
import { NotificationsSettings } from "./notifications-settings";
import { ToggleEmailCheckbox } from "./toggle-email-checkbox";

export const generateMetadata = combineWithParentMetadata({
  title: "Notifications",
  description: "Gérer tes paramètres de notifications.",
});

export default function Page() {
  return (
    <AccountLayout>
      <div className="flex flex-col gap-4">
        <NotificationsSettings />
        <Suspense fallback={null}>
          <MarketingEmailSection />
        </Suspense>
      </div>
    </AccountLayout>
  );
}

async function MarketingEmailSection() {
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
    return <MarketingEmailError />;
  }

  if (!env.RESEND_AUDIENCE_ID) {
    return <MarketingEmailError />;
  }

  const { data: resendUser } = await resend.contacts.get({
    audienceId: env.RESEND_AUDIENCE_ID,
    id: userWithResendContactId.resendContactId,
  });

  if (!resendUser) {
    return <MarketingEmailError />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Emails marketing</CardTitle>
        <CardDescription>
          Configure tes préférences pour les emails marketing et promotionnels.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ToggleEmailCheckbox unsubscribed={resendUser.unsubscribed} />
      </CardContent>
    </Card>
  );
}

function MarketingEmailError() {
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
}
