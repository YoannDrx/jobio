import { ProgrammeCard } from "./programme-card";

type Program = {
  id: string;
  slug: string;
  title: string;
  description: string;
  authorName: string;
  price: number;
  isFree: boolean;
  templateCount: number;
  isUnlocked: boolean;
};

type ProgrammeGridProps = {
  programs: Program[];
};

export function ProgrammeGrid({ programs }: ProgrammeGridProps) {
  if (programs.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        Aucun programme disponible
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {programs.map((program) => (
        <ProgrammeCard key={program.id} program={program} />
      ))}
    </div>
  );
}
