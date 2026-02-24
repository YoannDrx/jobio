"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarUploader } from "@/components/avatar-upload";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { uploadImageAction } from "@/features/images/upload-image.action";
import { Loader2 } from "lucide-react";
import { TagInput } from "../tag-input";
import { RichTextEditor } from "../rich-text-editor";
import { FieldError } from "../field-error";

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
    socialLinks: unknown;
  };
  onSave: (patch: Record<string, unknown>) => Promise<void>;
  isSaving: boolean;
};

const parseStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
};

const parseSocialLinksField = (
  value: unknown,
): {
  linkedinUrl: string;
  githubUrl: string;
  websiteUrl: string;
  maltUrl: string;
} => {
  const defaults = {
    linkedinUrl: "",
    githubUrl: "",
    websiteUrl: "",
    maltUrl: "",
  };
  if (!value || typeof value !== "object" || Array.isArray(value))
    return defaults;
  const obj = value as Record<string, unknown>;
  return {
    linkedinUrl: typeof obj.linkedinUrl === "string" ? obj.linkedinUrl : "",
    githubUrl: typeof obj.githubUrl === "string" ? obj.githubUrl : "",
    websiteUrl: typeof obj.websiteUrl === "string" ? obj.websiteUrl : "",
    maltUrl: typeof obj.maltUrl === "string" ? obj.maltUrl : "",
  };
};

export function PersonalInfoSection({
  data,
  onSave,
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
  const parsedSocialLinks = parseSocialLinksField(data.socialLinks);
  const [linkedinUrl, setLinkedinUrl] = useState(parsedSocialLinks.linkedinUrl);
  const [githubUrl, setGithubUrl] = useState(parsedSocialLinks.githubUrl);
  const [websiteUrl, setWebsiteUrl] = useState(parsedSocialLinks.websiteUrl);
  const [maltUrl, setMaltUrl] = useState(parsedSocialLinks.maltUrl);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const isInitialMount = useRef(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const errors = useMemo(() => {
    const e: Record<string, string | null> = {};
    e.fullName =
      fullName.trim().length === 0 ? "Le nom complet est requis" : null;
    e.email =
      email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ? "Format d'email invalide"
        : null;
    e.linkedinUrl =
      linkedinUrl && !linkedinUrl.startsWith("http") ? "URL invalide" : null;
    e.githubUrl =
      githubUrl && !githubUrl.startsWith("http") ? "URL invalide" : null;
    e.websiteUrl =
      websiteUrl && !websiteUrl.startsWith("http") ? "URL invalide" : null;
    e.maltUrl = maltUrl && !maltUrl.startsWith("http") ? "URL invalide" : null;
    return e;
  }, [fullName, email, linkedinUrl, githubUrl, websiteUrl, maltUrl]);

  const hasBlockingErrors = useMemo(
    () => Boolean(errors.fullName),
    [errors.fullName],
  );

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (hasBlockingErrors) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      void onSave({
        fullName,
        headline: headline || undefined,
        summary: summary || undefined,
        email: email || undefined,
        phone: phone || undefined,
        city: city || undefined,
        hobbies,
        driverLicenses,
        socialLinks: {
          linkedinUrl: linkedinUrl || undefined,
          githubUrl: githubUrl || undefined,
          websiteUrl: websiteUrl || undefined,
          maltUrl: maltUrl || undefined,
        },
      });
    }, 1500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    fullName,
    headline,
    email,
    phone,
    city,
    summary,
    hobbies,
    driverLicenses,
    linkedinUrl,
    githubUrl,
    websiteUrl,
    maltUrl,
    onSave,
    hasBlockingErrors,
  ]);

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
          <FieldError message={errors.fullName} />
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
          <FieldError message={errors.email} />
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
        <div className="flex flex-col gap-1">
          <Label>LinkedIn</Label>
          <Input
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/..."
          />
          <FieldError message={errors.linkedinUrl} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>GitHub</Label>
          <Input
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/..."
          />
          <FieldError message={errors.githubUrl} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Site web / Portfolio</Label>
          <Input
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://mon-site.fr"
          />
          <FieldError message={errors.websiteUrl} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Malt</Label>
          <Input
            value={maltUrl}
            onChange={(e) => setMaltUrl(e.target.value)}
            placeholder="https://malt.fr/profile/..."
          />
          <FieldError message={errors.maltUrl} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Label>Resume / Bio</Label>
        <RichTextEditor
          value={summary}
          onChange={setSummary}
          _placeholder="Decrivez votre parcours en quelques lignes..."
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
    </div>
  );
}
