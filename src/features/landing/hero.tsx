import { CircleSvg } from "@/components/svg/circle-svg";
import { buttonVariants } from "@/components/ui/button";
import DemoKanban from "@/features/landing/demos/demo-kanban";
import Link from "next/link";
import { Typography } from "../../components/nowts/typography";

export const Hero = () => {
  return (
    <div className="relative isolate flex flex-col">
      <GridBackground />
      <GradientBackground />
      <main className="relative py-24 sm:py-32 lg:pb-40">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Typography
              variant="h1"
              className="text-5xl font-bold tracking-tight text-balance sm:text-7xl lg:text-7xl"
            >
              Trouve des missions.
              <br />
              Relance au bon moment.
              <br />
              <span className="relative inline-block">
                <span>Signe plus</span>
                <CircleSvg className="fill-primary absolute inset-0" />
              </span>
              .
            </Typography>
            <Typography
              variant="large"
              className="text-muted-foreground mt-8 text-lg font-medium text-pretty sm:text-xl/8"
            >
              Le cockpit commercial des freelances tech. Pipeline intelligent,
              relances automatiques, scoring IA.
            </Typography>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/auth/signup"
                className={buttonVariants({ size: "lg", variant: "default" })}
              >
                Commencer gratuitement
              </Link>
              <Link
                href="#pricing"
                className={buttonVariants({ size: "lg", variant: "link" })}
              >
                Voir les plans <span aria-hidden="true">→</span>
              </Link>
            </div>
            <Typography
              variant="muted"
              className="text-muted-foreground mt-6 text-sm font-medium"
            >
              Pas de CB · Setup en 5 min · 15 missions gratuites
            </Typography>
          </div>
          <div className="bg-card/50 mt-16 overflow-hidden rounded-xl border shadow-2xl backdrop-blur-sm sm:mt-24">
            <div className="flex items-center gap-2 border-b px-4 py-2">
              <div className="flex gap-1.5">
                <div className="size-3 rounded-full bg-red-500/60" />
                <div className="size-3 rounded-full bg-yellow-500/60" />
                <div className="size-3 rounded-full bg-green-500/60" />
              </div>
              <div className="text-muted-foreground flex-1 text-center text-xs">
                app.jobio.fr
              </div>
            </div>
            <div className="p-4">
              <DemoKanban />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const GridBackground = () => {
  return (
    <div className="bg-grid absolute inset-0 [mask-image:linear-gradient(180deg,transparent,var(--foreground),transparent)]"></div>
  );
};

const GradientBackground = () => {
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      >
        <div
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
          className="from-brand-cyan/20 to-brand-emerald/20 relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
      >
        <div
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
          className="from-primary/30 relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr to-emerald-500/20 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
        />
      </div>
    </>
  );
};
