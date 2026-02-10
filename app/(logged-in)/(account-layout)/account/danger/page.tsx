import { combineWithParentMetadata } from "@/lib/metadata";
import { AccountLayout } from "../account-layout";
import { DeleteAccountForm } from "./delete-account-form";

export const generateMetadata = combineWithParentMetadata({
  title: "Delete Account",
  description: "Permanently delete your account and all associated data.",
});

export default function DeleteProfilePage() {
  return (
    <AccountLayout>
      <div className="flex flex-col gap-4 lg:gap-8">
        <DeleteAccountForm />
      </div>
    </AccountLayout>
  );
}
