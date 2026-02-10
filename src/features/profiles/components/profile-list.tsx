"use client";

import { Button } from "@/components/ui/button";
import { ProfileCard } from "@/features/profiles/components/profile-card";
import type { Skill } from "@/features/profiles/profiles.schema";
import { Pencil, Trash2 } from "lucide-react";

type Profile = {
  id: string;
  name: string;
  headline: string;
  skills: Skill[] | null;
  tjmTarget: number | null;
  workTypePreference: string | null;
  isDefault: boolean;
};

type ProfileListProps = {
  profiles: Profile[];
  onEdit: (profile: Profile) => void;
  onDelete: (profile: Profile) => void;
};

export function ProfileList({ profiles, onEdit, onDelete }: ProfileListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {profiles.map((profile) => (
        <div key={profile.id} className="relative">
          <ProfileCard
            name={profile.name}
            headline={profile.headline}
            skills={profile.skills}
            tjmTarget={profile.tjmTarget}
            workTypePreference={profile.workTypePreference}
            isDefault={profile.isDefault}
          />
          <div className="absolute top-4 right-4 flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(profile)}>
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(profile)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
