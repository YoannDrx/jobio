import { getRequiredUser } from "@/lib/auth/auth-user";
import { combineWithParentMetadata } from "@/lib/metadata";
import { Suspense } from "react";
import { AccountLayout } from "../account-layout";
import { EditProfileCardForm } from "./edit-profile-form";

export const generateMetadata = combineWithParentMetadata({
  title: "Paramètres",
  description: "Mettre à jour votre profil.",
});

export default function Page() {
  return (
    <AccountLayout>
      <div className="flex flex-col gap-4 lg:gap-8">
        <Suspense fallback={null}>
          <EditProfilePage />
        </Suspense>
      </div>
    </AccountLayout>
  );
}

async function EditProfilePage() {
  const user = await getRequiredUser();

  return (
    <div className="flex flex-col gap-4 lg:gap-8">
      <EditProfileCardForm defaultValues={user} />
    </div>
  );
}
