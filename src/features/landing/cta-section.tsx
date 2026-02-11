import { Typography } from "@/components/nowts/typography";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { SectionLayout } from "./section-layout";

export const CTASection = () => {
  return (
    <SectionLayout size="sm" variant="default">
      <div className="border-border bg-card/50 flex flex-col items-center gap-6 rounded-2xl border px-6 py-16 text-center shadow-sm sm:px-12 sm:py-20">
        <Typography
          variant="h2"
          className="text-4xl font-bold tracking-tight text-balance sm:text-5xl"
        >
          Prêt à signer ta prochaine mission ?
        </Typography>
        <Typography
          variant="large"
          className="text-muted-foreground max-w-2xl text-lg font-medium text-pretty"
        >
          Rejoins les freelances qui utilisent Jobio pour organiser leur
          prospection et décrocher plus de missions.
        </Typography>
        <div className="mt-4 flex flex-col items-center gap-4">
          <Link
            href="/auth/signup"
            className={buttonVariants({ size: "lg", variant: "default" })}
          >
            Commencer gratuitement
          </Link>
          <Typography
            variant="muted"
            className="text-muted-foreground text-sm font-medium"
          >
            Pas de CB requise · 15 missions offertes
          </Typography>
        </div>
      </div>
    </SectionLayout>
  );
};
