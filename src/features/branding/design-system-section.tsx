import { DesignSystemCard } from "./design-system-card";

const designSystems = [
  {
    name: "Glassmorphism",
    description:
      "Cards semi-transparentes avec backdrop-blur, gradients subtils, ombres douces",
    colors: ["#06b6d4", "#8b5cf6", "#f0f9ff", "#e0f2fe", "#ffffff"],
    bgClassName:
      "bg-gradient-to-br from-cyan-50/80 to-blue-50/80 backdrop-blur-sm",
    cardClassName:
      "bg-white/60 backdrop-blur-md border border-white/40 shadow-lg",
    buttonClassName: "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25",
    outlineButtonClassName: "border-cyan-300 text-cyan-700 bg-white/50",
    textClassName: "text-slate-800",
  },
  {
    name: "Bold Minimal",
    description:
      "Typographie forte, fort contraste noir/blanc, couleurs vives en accent",
    colors: ["#06b6d4", "#000000", "#ffffff", "#f4f4f5", "#18181b"],
    bgClassName: "bg-white",
    cardClassName: "border-2 border-zinc-900 bg-zinc-50 rounded-sm",
    buttonClassName: "bg-zinc-900 text-white rounded-sm",
    outlineButtonClassName: "border-2 border-zinc-900 text-zinc-900 rounded-sm",
    textClassName: "text-zinc-900",
  },
  {
    name: "Soft Pastel",
    description:
      "Coins très arrondis, ombres douces, couleurs pastelles, feeling warm",
    colors: ["#a5f3fc", "#c4b5fd", "#fef3c7", "#fce7f3", "#fefce8"],
    bgClassName: "bg-amber-50/50",
    cardClassName: "bg-white rounded-2xl shadow-sm border border-cyan-100",
    buttonClassName: "bg-cyan-300 text-cyan-900 rounded-full",
    outlineButtonClassName:
      "border border-violet-200 text-violet-600 rounded-full",
    textClassName: "text-slate-700",
  },
  {
    name: "Dark Neon",
    description:
      "Dark-first, accents néon cyan/violet avec glow effects, glassy dark",
    colors: ["#06b6d4", "#8b5cf6", "#1e1b4b", "#0f172a", "#06b6d4"],
    bgClassName: "bg-slate-950",
    cardClassName:
      "bg-slate-900/80 border border-cyan-500/20 shadow-lg shadow-cyan-500/5",
    buttonClassName: "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30",
    outlineButtonClassName: "border border-violet-500/40 text-violet-400",
    textClassName: "text-slate-200",
  },
];

export const DesignSystemSection = () => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    {designSystems.map((ds) => (
      <DesignSystemCard key={ds.name} {...ds} />
    ))}
  </div>
);
