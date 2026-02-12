"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/nowts/empty-state";
import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  createProfileAction,
  deleteProfileAction,
  getProfilesAction,
  updateProfileAction,
} from "@/features/profiles/profiles.action";
import { ProfileForm } from "@/features/profiles/components/profile-form";
import { ProfileList } from "@/features/profiles/components/profile-list";
import { LinkedInImportTabs } from "@/features/profiles/components/linkedin-import-tabs";
import type {
  Certification,
  CreateProfileInput,
  Education,
  Experience,
  Language,
  Project,
  Skill,
} from "@/features/profiles/profiles.schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, UserCircle, Import } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Profile = {
  id: string;
  name: string;
  headline: string;
  bio: string | null;
  skills: Skill[] | null;
  experiences: Experience[] | null;
  education: Education[] | null;
  certifications: Certification[] | null;
  languages: Language[] | null;
  projects: Project[] | null;
  tjmTarget: number | null;
  workTypePreference: string | null;
  zone: string | null;
  minDuration: string | null;
  maxDuration: string | null;
  isDefault: boolean;
};

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

  const fetchProfiles = useCallback(async () => {
    try {
      const result = await resolveActionResult(getProfilesAction({}));
      setProfiles(
        result.map((p) => ({
          id: p.id,
          name: p.name,
          headline: p.headline,
          bio: p.bio,
          skills: p.skills as Skill[] | null,
          experiences: p.experiences as Experience[] | null,
          education: p.education as Education[] | null,
          certifications: p.certifications as Certification[] | null,
          languages: p.languages as Language[] | null,
          projects: p.projects as Project[] | null,
          tjmTarget: p.tjmTarget,
          workTypePreference: p.workTypePreference,
          zone: p.zone,
          minDuration: p.minDuration,
          maxDuration: p.maxDuration,
          isDefault: p.isDefault,
        })),
      );
    } catch {
      toast.error("Erreur lors du chargement des profils");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfiles();
  }, [fetchProfiles]);

  const handleCreate = async (data: CreateProfileInput) => {
    await resolveActionResult(createProfileAction(data));
    toast.success("Profil créé avec succès");
    setShowForm(false);
    void fetchProfiles();
  };

  const handleUpdate = async (data: CreateProfileInput) => {
    if (!editingProfile) return;
    await resolveActionResult(
      updateProfileAction({ id: editingProfile.id, ...data }),
    );
    toast.success("Profil mis à jour");
    setEditingProfile(null);
    void fetchProfiles();
  };

  const handleDelete = async (profile: Profile) => {
    await resolveActionResult(deleteProfileAction({ id: profile.id }));
    toast.success("Profil supprimé");
    void fetchProfiles();
  };

  const handleImport = (data: Partial<CreateProfileInput>) => {
    setShowImport(false);
    setEditingProfile(null);
    setShowForm(true);
    // Pre-fill form with imported data — stored in state, passed as defaultValues
    setImportedData(data);
  };

  const [importedData, setImportedData] =
    useState<Partial<CreateProfileInput> | null>(null);

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>Profils</LayoutTitle>
      </LayoutHeader>
      <LayoutActions className="gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowImport(!showImport)}
        >
          <Import className="size-4" />
          Import LinkedIn
        </Button>
        <Button
          size="sm"
          onClick={() => {
            setImportedData(null);
            setShowForm(true);
          }}
        >
          <Plus className="size-4" />
          Nouveau profil
        </Button>
      </LayoutActions>

      <LayoutContent className="flex flex-col gap-4">
        {/* LinkedIn Import */}
        {showImport && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Import className="size-4" />
                Import LinkedIn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LinkedInImportTabs onImport={handleImport} />
            </CardContent>
          </Card>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="text-muted-foreground py-12 text-center text-sm">
            Chargement...
          </div>
        ) : profiles.length === 0 ? (
          <EmptyState
            icon={UserCircle}
            title="Aucun profil"
            description="Crée ton premier profil freelance pour personnaliser le scoring des missions."
            action={{
              label: "Créer un profil",
              onClick: () => setShowForm(true),
            }}
          />
        ) : (
          <ProfileList
            profiles={profiles}
            onEdit={(p) => {
              setImportedData(null);
              const full = profiles.find((pr) => pr.id === p.id);
              if (full) setEditingProfile(full);
            }}
            onDelete={(p) => {
              const full = profiles.find((pr) => pr.id === p.id);
              if (full) void handleDelete(full);
            }}
          />
        )}
      </LayoutContent>

      {/* Create dialog */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setImportedData(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouveau profil</DialogTitle>
          </DialogHeader>
          <ProfileForm
            onSubmit={handleCreate}
            onCancel={() => {
              setShowForm(false);
              setImportedData(null);
            }}
            defaultValues={importedData ?? undefined}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={editingProfile !== null}
        onOpenChange={(open) => {
          if (!open) setEditingProfile(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le profil</DialogTitle>
          </DialogHeader>
          {editingProfile && (
            <ProfileForm
              onSubmit={handleUpdate}
              onCancel={() => setEditingProfile(null)}
              defaultValues={{
                name: editingProfile.name,
                headline: editingProfile.headline,
                bio: editingProfile.bio ?? undefined,
                skills: (editingProfile.skills ??
                  []) as CreateProfileInput["skills"],
                experiences: (editingProfile.experiences ??
                  []) as CreateProfileInput["experiences"],
                education: (editingProfile.education ??
                  []) as CreateProfileInput["education"],
                certifications: (editingProfile.certifications ??
                  []) as CreateProfileInput["certifications"],
                languages: (editingProfile.languages ??
                  []) as CreateProfileInput["languages"],
                projects: (editingProfile.projects ??
                  []) as CreateProfileInput["projects"],
                tjmTarget: editingProfile.tjmTarget ?? undefined,
                workTypePreference: editingProfile.workTypePreference as
                  | "REMOTE"
                  | "HYBRID"
                  | "ONSITE"
                  | undefined,
                zone: editingProfile.zone ?? undefined,
                minDuration: editingProfile.minDuration ?? undefined,
                maxDuration: editingProfile.maxDuration ?? undefined,
                isDefault: editingProfile.isDefault,
              }}
              submitLabel="Modifier"
            />
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
