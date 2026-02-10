import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getRequiredAdmin } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { UserDetailsCard } from "../../_components/user-details-card";
import { UserActions } from "./_components/user-actions";
import { UserProviders } from "./_components/user-providers";
import { UserSessions } from "./_components/user-sessions";

export default async function Page(props: PageProps<"/admin/users/[userId]">) {
  return (
    <Suspense fallback={null}>
      <RoutePage {...props} />
    </Suspense>
  );
}

async function RoutePage(props: PageProps<"/admin/users/[userId]">) {
  const params = await props.params;
  await getRequiredAdmin();

  const userData = await prisma.user.findUnique({
    where: {
      id: params.userId,
    },
    include: {
      accounts: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!userData) {
    notFound();
  }

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>User Details</LayoutTitle>
        <LayoutDescription>
          View and manage user information and organization memberships
        </LayoutDescription>
      </LayoutHeader>
      <LayoutActions>
        <UserActions user={userData} />
      </LayoutActions>

      <LayoutContent className="flex flex-col gap-4">
        <UserDetailsCard user={userData} />
        <UserSessions userId={userData.id} />
        <UserProviders accounts={userData.accounts} />
      </LayoutContent>
    </Layout>
  );
}
