import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type PublicPageShellProps = {
  badge: string;
  title: string;
  description: string;
  lastUpdated?: string;
  highlights?: string[];
  children: ReactNode;
};

export function PublicPageShell({
  badge,
  title,
  description,
  lastUpdated,
  highlights = [],
  children,
}: PublicPageShellProps) {
  return (
    <div className="relative isolate overflow-hidden pb-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="from-primary/15 via-brand-cyan/10 to-brand-emerald/15 absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b" />
        <div className="bg-background absolute inset-x-0 bottom-0 h-[300px]" />
        <div className="bg-brand-cyan/20 absolute top-24 left-[8%] size-40 rounded-full blur-3xl" />
        <div className="bg-brand-emerald/20 absolute top-16 right-[12%] size-44 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 pt-14 pb-8 lg:px-8">
        <div className="flex w-full flex-col gap-5 rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-black/20">
          <Badge className="w-fit">{badge}</Badge>
          <div className="max-w-3xl space-y-3">
            <h1 className="text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
              {title}
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed sm:text-lg">
              {description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {lastUpdated ? (
              <MetaPill label={`Mis à jour le ${lastUpdated}`} tone="default" />
            ) : null}
            {highlights.map((item) => (
              <MetaPill key={item} label={item} tone="subtle" />
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-wrap gap-4 px-4 lg:px-8">
        {children}
      </div>
    </div>
  );
}

export function PublicSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "w-full rounded-2xl border border-black/5 bg-white/80 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-black/20 sm:p-7",
        className,
      )}
    >
      <div className="mb-4 space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function MetaPill({
  label,
  tone,
}: {
  label: string;
  tone: "default" | "subtle";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs",
        tone === "default"
          ? "border-primary/25 bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}
