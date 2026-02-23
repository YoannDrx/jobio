"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AvatarUploader } from "@/components/avatar-upload";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { uploadImageAction } from "@/features/images/upload-image.action";
import { Loader2 } from "lucide-react";
import { TagInput } from "../tag-input";

type PersonalInfoSectionProps = {
  data: {
    fullName: string;
    headline: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    summary: string | null;
    photoUrl: string | null;
    hobbies: unknown;
    driverLicenses: unknown;
  };
  onSave: (patch: Record<string, unknown>) => Promise<void>;
  isSaving: boolean;
};

const parseStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
};

export function PersonalInfoSection({
  data,
  onSave,
  isSaving,
}: PersonalInfoSectionProps) {
  const [fullName, setFullName] = useState(data.fullName);
  const [headline, setHeadline] = useState(data.headline ?? "");
  const [email, setEmail] = useState(data.email ?? "");
  const [phone, setPhone] = useState(data.phone ?? "");
  const [city, setCity] = useState(data.city ?? "");
  const [summary, setSummary] = useState(data.summary ?? "");
  const [photoUrl, setPhotoUrl] = useState(data.photoUrl ?? "");
  const [hobbies, setHobbies] = useState<string[]>(
    parseStringArray(data.hobbies),
  );
  const [driverLicenses, setDriverLicenses] = useState<string[]>(
    parseStringArray(data.driverLicenses),
  );
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handlePhotoUpload = async (file: File) => {
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("files", file);
      const url = await resolveActionResult(uploadImageAction({ formData }));
      setPhotoUrl(url);
      await onSave({ photoUrl: url });
      toast.success("Photo mise a jour");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur upload photo",
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    await onSave({
      fullName,
      headline: headline || undefined,
      summary: summary || undefined,
      email: email || undefined,
      phone: phone || undefined,
      city: city || undefined,
      hobbies,
      driverLicenses,
    });
  };

  const handleRemovePhoto = async () => {
    if (!photoUrl) return;
    setPhotoUrl("");
    try {
      await onSave({ photoUrl: "" });
      toast.success("Photo supprimee");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur suppression photo",
      );
      setPhotoUrl(data.photoUrl ?? "");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <AvatarUploader
          onImageChange={handlePhotoUpload}
          onImageRemove={handleRemovePhoto}
          currentAvatar={photoUrl || null}
        />
        {isUploadingPhoto && (
          <div className="text-muted-foreground flex items-center gap-2 pt-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Upload en cours...
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label>Nom complet *</Label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jean Dupont"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Titre professionnel</Label>
          <Input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Developpeur Full Stack"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Email</Label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jean@example.com"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Telephone</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+33 6 12 34 56 78"
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <Label>Ville</Label>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Paris, France"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Label>Resume / Bio</Label>
        <Textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
          placeholder="Decrivez votre parcours en quelques lignes..."
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label>Centres d&apos;interet</Label>
        <TagInput
          tags={hobbies}
          onChange={setHobbies}
          placeholder="Ajouter un centre d'interet"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label>Permis de conduire</Label>
        <TagInput
          tags={driverLicenses}
          onChange={setDriverLicenses}
          placeholder="Ajouter un permis (B, A2...)"
        />
      </div>
      <Button onClick={handleSave} disabled={isSaving || !fullName.trim()}>
        {isSaving ? "Sauvegarde..." : "Sauvegarder les infos personnelles"}
      </Button>
    </div>
  );
}
