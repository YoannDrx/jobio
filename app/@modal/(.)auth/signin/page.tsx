import { LogoSvg } from "@/components/svg/logo-svg";
import {
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { InterceptDialog } from "@/components/utils/intercept-dialog";
import { SocialProviders } from "@/lib/auth";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import { SignInModal } from "./signin";

export const metadata: Metadata = {
  robots: NO_INDEX_ROBOTS,
};

export default function SignInDialogPage() {
  return (
    <InterceptDialog>
      <DialogContent className="bg-card">
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="mx-auto mt-4 flex flex-row items-center gap-2">
            <LogoSvg size={32} />
            <DialogTitle className="text-lg font-semibold">
              {SiteConfig.title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground mt-2 text-center">
            Connecte-toi pour continuer.
          </DialogDescription>
        </div>
        <SignInModal providers={Object.keys(SocialProviders ?? {})} />
      </DialogContent>
    </InterceptDialog>
  );
}
