import { Badge } from "@/components/ui/badge";

type DesignSystemCardProps = {
  name: string;
  description: string;
  colors: string[];
  cardClassName: string;
  buttonClassName: string;
  outlineButtonClassName: string;
  textClassName: string;
  bgClassName: string;
};

export const DesignSystemCard = ({
  name,
  description,
  colors,
  cardClassName,
  buttonClassName,
  outlineButtonClassName,
  textClassName,
  bgClassName,
}: DesignSystemCardProps) => (
  <div className={`flex flex-col gap-4 rounded-xl border p-6 ${bgClassName}`}>
    <div className="flex items-center justify-between">
      <Badge variant="secondary">{name}</Badge>
    </div>
    <p className={`text-sm ${textClassName}`}>{description}</p>
    {/* Palette */}
    <div className="flex gap-2">
      {colors.map((c) => (
        <div
          key={c}
          className="size-8 rounded-full border"
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
    {/* Sample card */}
    <div className={`rounded-lg p-4 ${cardClassName}`}>
      <p className={`text-sm font-semibold ${textClassName}`}>
        Titre de mission
      </p>
      <p className={`text-xs opacity-70 ${textClassName}`}>
        Développeur Full-Stack — 650€/j
      </p>
    </div>
    {/* Buttons */}
    <div className="flex gap-2">
      <button
        className={`rounded-md px-4 py-2 text-sm font-medium ${buttonClassName}`}
      >
        Postuler
      </button>
      <button
        className={`rounded-md border px-4 py-2 text-sm font-medium ${outlineButtonClassName}`}
      >
        Détails
      </button>
    </div>
  </div>
);
