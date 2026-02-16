import { combineWithParentMetadata } from "@/lib/metadata";
import { AccountLayout } from "../account-layout";
import { AppearanceSettings } from "./appearance-settings";

export const generateMetadata = combineWithParentMetadata({
  title: "Apparence",
  description: "Personnalise le thème et la langue de l'application.",
});

export default function Page() {
  return (
    <AccountLayout>
      <AppearanceSettings />
    </AccountLayout>
  );
}
