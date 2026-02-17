import { LogoCard } from "./logo-card";
import { LogoAppIcon } from "./logos/logo-app-icon";
import { LogoGradientFlow } from "./logos/logo-gradient-flow";
import { LogoCircleMonogram } from "./logos/logo-circle-monogram";
import { LogoDiamondAccent } from "./logos/logo-diamond-accent";
import { LogoTerminal } from "./logos/logo-terminal";
import { LogoNeonWire } from "./logos/logo-neon-wire";
import { LogoStackedBlocks } from "./logos/logo-stacked-blocks";
import { LogoWaveUnderline } from "./logos/logo-wave-underline";
import { LogoSplitClean } from "./logos/logo-split-clean";
import { LogoPillDuo } from "./logos/logo-pill-duo";
import { LogoCodeTag } from "./logos/logo-code-tag";
import { LogoGradientMerge } from "./logos/logo-gradient-merge";
import { LogoNeonApp } from "./logos/logo-neon-app";
import { LogoSlashSplit } from "./logos/logo-slash-split";
import { LogoDotSeparator } from "./logos/logo-dot-separator";
import { LogoOutlineIO } from "./logos/logo-outline-io";
import { LogoStackedDuo } from "./logos/logo-stacked-duo";
import { LogoBracketIO } from "./logos/logo-bracket-io";
import { LogoCircleIO } from "./logos/logo-circle-io";
import { LogoBlockAccent } from "./logos/logo-block-accent";
import { LogoIconPulse } from "./logos/logo-icon-pulse";
import { LogoIconArrow } from "./logos/logo-icon-arrow";
import { LogoIconPipeline } from "./logos/logo-icon-pipeline";
import { LogoIconLightning } from "./logos/logo-icon-lightning";
import { LogoIconTarget } from "./logos/logo-icon-target";
import { LogoIconLayers } from "./logos/logo-icon-layers";
import { LogoIconCompass } from "./logos/logo-icon-compass";
import { LogoIconRocket } from "./logos/logo-icon-rocket";
import { LogoIconHexGrid } from "./logos/logo-icon-hexgrid";
import { LogoIconChatCheck } from "./logos/logo-icon-chat-check";

const originalLogos = [
  {
    name: "App Icon J",
    description: "Clean, app moderne, identifiable en petit",
    logo: LogoAppIcon,
  },
  {
    name: "Gradient Flow J",
    description: "Dynamique, flow, métaphore pipeline",
    logo: LogoGradientFlow,
  },
  {
    name: "Circle Monogram",
    description: "Premium, minimal, brand forte",
    logo: LogoCircleMonogram,
  },
  {
    name: "Diamond Accent",
    description: "Distinctif, signature bicolore, tech chaleureux",
    logo: LogoDiamondAccent,
  },
  {
    name: "Terminal Prompt",
    description: "Dev-friendly, tech authentique, hacker-chic",
    logo: LogoTerminal,
  },
  {
    name: "Neon Wire",
    description: "Élégant, minimal, futuriste",
    logo: LogoNeonWire,
  },
  {
    name: "Stacked Blocks",
    description: "Constructif, structure, progression de carrière",
    logo: LogoStackedBlocks,
  },
  {
    name: "Wave Underline",
    description: "Fluide, dynamique, friendly",
    logo: LogoWaveUnderline,
  },
];

const jobioLogos = [
  {
    name: "Split Clean",
    description: "Squircle dark avec J blanc, OB + IO cyan. App-ready.",
    logo: LogoSplitClean,
  },
  {
    name: "Pill Duo",
    description: "Deux pilules JOB noir + IO cyan. Bold et mémorable.",
    logo: LogoPillDuo,
  },
  {
    name: "Code Tag",
    description: "<JOB/> IO — Style développeur, tech authentique.",
    logo: LogoCodeTag,
  },
  {
    name: "Gradient Merge",
    description: "JOB neutre + IO en dégradé cyan→emerald. Flow moderne.",
    logo: LogoGradientMerge,
  },
  {
    name: "Neon App",
    description: "Fond sombre, JOB blanc, IO néon cyan. Premium dark.",
    logo: LogoNeonApp,
  },
  {
    name: "Slash Split",
    description: "JOB/IO avec slash diagonal cyan. Net et dynamique.",
    logo: LogoSlashSplit,
  },
  {
    name: "Dot Separator",
    description: "JOB·IO avec point cyan central. Clean et élégant.",
    logo: LogoDotSeparator,
  },
  {
    name: "Outline IO",
    description: "JOB plein + IO en contour cyan. Contraste subtil.",
    logo: LogoOutlineIO,
  },
  {
    name: "Stacked Duo",
    description: "JOB en grand, IO cyan en dessous à droite. Hiérarchique.",
    logo: LogoStackedDuo,
  },
  {
    name: "Bracket IO",
    description: "JOB [IO] — Style array/code, tech et structuré.",
    logo: LogoBracketIO,
  },
  {
    name: "Circle IO",
    description: "JOB + IO dans un cercle cyan. Icône identifiable.",
    logo: LogoCircleIO,
  },
  {
    name: "Block Accent",
    description: "JOB + IO surligné cyan. Highlight marketing.",
    logo: LogoBlockAccent,
  },
];

const iconLogos = [
  {
    name: "Pulse Signal",
    description: "Arcs de signal — veille active, outreach, broadcasting.",
    logo: LogoIconPulse,
  },
  {
    name: "Arrow Up",
    description: "Flèche ascendante — croissance, progression de carrière.",
    logo: LogoIconArrow,
  },
  {
    name: "Pipeline Flow",
    description: "Cercles connectés — workflow, pipeline de missions.",
    logo: LogoIconPipeline,
  },
  {
    name: "Lightning",
    description: "Éclair — rapidité, efficacité, énergie.",
    logo: LogoIconLightning,
  },
  {
    name: "Target",
    description: "Cible — précision, ciblage de missions, focus.",
    logo: LogoIconTarget,
  },
  {
    name: "Layers",
    description: "Couches empilées — structure, organisation.",
    logo: LogoIconLayers,
  },
  {
    name: "Compass",
    description: "Boussole — navigation, trouver sa voie.",
    logo: LogoIconCompass,
  },
  {
    name: "Rocket",
    description: "Fusée — lancement, ambition, vitesse.",
    logo: LogoIconRocket,
  },
  {
    name: "Hex Grid",
    description: "Hexagones — réseau, structure modulaire.",
    logo: LogoIconHexGrid,
  },
  {
    name: "Chat Check",
    description: "Bulle + check — communication réussie, deal conclu.",
    logo: LogoIconChatCheck,
  },
];

export const LogoShowcase = ({
  section,
}: {
  section: "original" | "jobio" | "icon";
}) => {
  const logos =
    section === "original"
      ? originalLogos
      : section === "jobio"
        ? jobioLogos
        : iconLogos;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {logos.map((l) => (
        <LogoCard key={l.name} {...l} />
      ))}
    </div>
  );
};
