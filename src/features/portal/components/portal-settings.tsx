"use client";

import { useEffect, useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  getPortalAction,
  upsertPortalAction,
} from "@/features/portal/portal.action";
import { toast } from "sonner";
import { Copy, ExternalLink, Loader2 } from "lucide-react";
import { SiteConfig } from "@/site-config";

type PortalSettingsProps = {
  profileId: string;
  profileName: string;
};

export function PortalSettings({
  profileId,
  profileName,
}: PortalSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  const [slug, setSlug] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [customBio, setCustomBio] = useState("");
  const [showSkills, setShowSkills] = useState(true);
  const [showExperiences, setShowExperiences] = useState(true);
  const [showEducation, setShowEducation] = useState(true);
  const [showProjects, setShowProjects] = useState(true);
  const [showLanguages, setShowLanguages] = useState(true);
  const [showTjm, setShowTjm] = useState(false);
  const [showAvailability, setShowAvailability] = useState(true);

  useEffect(() => {
    resolveActionResult(getPortalAction({ profileId }))
      .then((portal) => {
        if (portal) {
          setSlug(portal.slug);
          setIsPublic(portal.isPublic);
          setCustomBio(portal.customBio ?? "");
          setShowSkills(portal.showSkills);
          setShowExperiences(portal.showExperiences);
          setShowEducation(portal.showEducation);
          setShowProjects(portal.showProjects);
          setShowLanguages(portal.showLanguages);
          setShowTjm(portal.showTjm);
          setShowAvailability(portal.showAvailability);
        } else {
          const defaultSlug = profileName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
          setSlug(defaultSlug);
        }
      })
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, [profileId, profileName]);

  const publicUrl = `${SiteConfig.prodUrl}/p/${slug}`;

  const handleSave = () => {
    startTransition(async () => {
      try {
        await resolveActionResult(
          upsertPortalAction({
            profileId,
            slug,
            isPublic,
            customBio: customBio || null,
            showSkills,
            showExperiences,
            showEducation,
            showProjects,
            showLanguages,
            showTjm,
            showAvailability,
          }),
        );
        toast.success("Portail mis a jour");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Erreur lors de la sauvegarde",
        );
      }
    });
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    toast.success("Lien copie");
  };

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center p-8">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4 p-6">
        <h3 className="text-lg font-semibold">Portail client</h3>

        <div className="flex flex-col gap-2">
          <Label htmlFor="slug">URL du portail</Label>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              {SiteConfig.prodUrl}/p/
            </span>
            <Input
              id="slug"
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
              placeholder="mon-profil"
              className="max-w-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="is-public"
            checked={isPublic}
            onCheckedChange={setIsPublic}
          />
          <Label htmlFor="is-public">Portail public</Label>
        </div>

        {isPublic && slug ? (
          <div className="bg-muted flex items-center gap-2 rounded-lg p-3">
            <p className="flex-1 truncate text-sm">{publicUrl}</p>
            <Button variant="ghost" size="sm" onClick={handleCopyLink}>
              <Copy className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
              </a>
            </Button>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <Label htmlFor="custom-bio">Bio personnalisee (optionnel)</Label>
          <Textarea
            id="custom-bio"
            value={customBio}
            onChange={(e) => setCustomBio(e.target.value)}
            placeholder="Une description personnalisee pour vos clients..."
            rows={3}
          />
        </div>
      </Card>

      <Card className="flex flex-col gap-4 p-6">
        <h3 className="text-lg font-semibold">Sections visibles</h3>

        <ToggleRow
          id="show-skills"
          label="Competences"
          checked={showSkills}
          onChange={setShowSkills}
        />
        <ToggleRow
          id="show-experiences"
          label="Experiences"
          checked={showExperiences}
          onChange={setShowExperiences}
        />
        <ToggleRow
          id="show-education"
          label="Formation"
          checked={showEducation}
          onChange={setShowEducation}
        />
        <ToggleRow
          id="show-projects"
          label="Projets"
          checked={showProjects}
          onChange={setShowProjects}
        />
        <ToggleRow
          id="show-languages"
          label="Langues"
          checked={showLanguages}
          onChange={setShowLanguages}
        />
        <ToggleRow
          id="show-tjm"
          label="TJM"
          checked={showTjm}
          onChange={setShowTjm}
        />
        <ToggleRow
          id="show-availability"
          label="Disponibilite"
          checked={showAvailability}
          onChange={setShowAvailability}
        />
      </Card>

      <Button onClick={handleSave} disabled={isPending || !slug}>
        {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        Enregistrer
      </Button>
    </div>
  );
}

function ToggleRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
}
