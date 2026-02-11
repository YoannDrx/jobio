import type { ComponentType } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type LogoCardProps = {
  name: string;
  description: string;
  logo: ComponentType<{ size?: number; className?: string }>;
};

export const LogoCard = ({ name, description, logo: Logo }: LogoCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Tailles multiples fond clair */}
        <div className="bg-muted/50 flex items-center gap-6 rounded-lg p-4">
          <Logo size={24} />
          <Logo size={32} />
          <Logo size={48} />
        </div>
        {/* Dark preview */}
        <div className="flex items-center justify-center rounded-lg bg-zinc-900 p-4">
          <Logo size={32} className="text-white" />
        </div>
        {/* Mock navbar */}
        <div className="bg-card flex items-center gap-2 rounded-lg border p-2">
          <Logo size={20} />
          <span className="text-sm font-semibold">Jobio</span>
        </div>
      </CardContent>
    </Card>
  );
};
