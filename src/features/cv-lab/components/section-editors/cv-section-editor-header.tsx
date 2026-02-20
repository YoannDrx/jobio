"use client";

import { AvatarUploader } from "@/components/avatar-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCvLabDocumentAction } from "@/features/cv-lab/cv-lab.action";
import type { PersonalInfoOverrides } from "@/features/cv-lab/cv-lab.schema";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

type CvProfile = {
  headline: string;
  name: string;
};

type Draft = {
  headlineOverride: string;
};

type CvSectionEditorHeaderProps = {
  profile: CvProfile;
  draft: Draft;
  onDraftChange: (patch: Partial<Draft>) => void;
  documentId?: string;
  personalInfo?: PersonalInfoOverrides;
  onOverridesSaved?: () => Promise<void>;
};

export function CvSectionEditorHeader({
  profile,
  draft,
  onDraftChange,
  documentId,
  personalInfo,
  onOverridesSaved,
}: CvSectionEditorHeaderProps) {
  const [email, setEmail] = useState(personalInfo?.email ?? "");
  const [phone, setPhone] = useState(personalInfo?.phone ?? "");
  const [city, setCity] = useState(personalInfo?.city ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [hobbies, setHobbies] = useState<string[]>(personalInfo?.hobbies ?? []);
  const [driverLicenses, setDriverLicenses] = useState<string[]>(
    personalInfo?.driverLicenses ?? [],
  );
  const [isSaving, setIsSaving] = useState(false);

  const hobbyInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  const addTag = (
    list: string[],
    setList: (v: string[]) => void,
    inputRef: React.RefObject<HTMLInputElement | null>,
  ) => {
    const value = inputRef.current?.value.trim();
    if (!value) return;
    if (!list.includes(value)) {
      setList([...list, value]);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const removeTag = (
    list: string[],
    setList: (v: string[]) => void,
    index: number,
  ) => {
    setList(list.filter((_, i) => i !== index));
  };

  const handleSavePersonalInfo = async () => {
    if (!documentId || !onOverridesSaved) return;
    setIsSaving(true);
    try {
      const data: PersonalInfoOverrides = {
        email: email || undefined,
        phone: phone || undefined,
        city: city || undefined,
        hobbies: hobbies.length > 0 ? hobbies : undefined,
        driverLicenses: driverLicenses.length > 0 ? driverLicenses : undefined,
      };

      if (photoFile) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(photoFile);
        });
        data.photoUrl = dataUrl;
      }

      await resolveActionResult(
        updateCvLabDocumentAction({
          id: documentId,
          personalInfo: data,
        }),
      );
      toast.success("Informations personnelles sauvegardées");
      await onOverridesSaved();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur de sauvegarde",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Nom (profil)</Label>
        <Input value={profile.name} readOnly className="bg-muted/40" />
        <p className="text-muted-foreground text-xs">
          Le nom provient du profil et ne peut pas être modifié ici.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Titre professionnel (profil)</Label>
        <Input value={profile.headline} readOnly className="bg-muted/40" />
        <p className="text-muted-foreground text-xs">
          Titre par défaut du profil.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="headline-override">Titre personnalisé (ce CV)</Label>
        <Input
          id="headline-override"
          value={draft.headlineOverride}
          placeholder={profile.headline || "Ex: Lead Product Engineer"}
          onChange={(event) =>
            onDraftChange({ headlineOverride: event.target.value })
          }
        />
        <p className="text-muted-foreground text-xs">
          Remplace le titre du profil sur ce CV uniquement. Laissez vide pour
          utiliser le titre du profil.
        </p>
      </div>
      {documentId && (
        <>
          <hr className="my-1" />
          <p className="text-sm font-medium">
            Informations personnelles (ce CV)
          </p>
          <div className="flex flex-col gap-2">
            <Label>Photo</Label>
            <AvatarUploader
              onImageChange={setPhotoFile}
              currentAvatar={personalInfo?.photoUrl}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email-override">Email</Label>
            <Input
              id="email-override"
              type="email"
              value={email}
              placeholder="email@example.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone-override">Telephone</Label>
            <Input
              id="phone-override"
              type="tel"
              value={phone}
              placeholder="+33 6 12 34 56 78"
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="city-override">Ville</Label>
            <Input
              id="city-override"
              value={city}
              placeholder="Paris, France"
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Centres d&apos;interet</Label>
            <div className="flex flex-wrap gap-1">
              {hobbies.map((hobby, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {hobby}
                  <button
                    type="button"
                    onClick={() => removeTag(hobbies, setHobbies, i)}
                    className="hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                ref={hobbyInputRef}
                placeholder="Ajouter un centre d'interet"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(hobbies, setHobbies, hobbyInputRef);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => addTag(hobbies, setHobbies, hobbyInputRef)}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Permis de conduire</Label>
            <div className="flex flex-wrap gap-1">
              {driverLicenses.map((license, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {license}
                  <button
                    type="button"
                    onClick={() =>
                      removeTag(driverLicenses, setDriverLicenses, i)
                    }
                    className="hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                ref={licenseInputRef}
                placeholder="Ex: B, A2..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(driverLicenses, setDriverLicenses, licenseInputRef);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  addTag(driverLicenses, setDriverLicenses, licenseInputRef)
                }
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
          <Button onClick={handleSavePersonalInfo} disabled={isSaving}>
            {isSaving
              ? "Sauvegarde..."
              : "Sauvegarder les informations personnelles"}
          </Button>
        </>
      )}
    </div>
  );
}
