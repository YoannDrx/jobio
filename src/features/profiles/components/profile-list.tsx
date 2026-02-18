"use client";

import { ProfileCard } from "@/features/profiles/components/profile-card";
import type {
  Skill,
  Experience,
  Education,
  Language,
  Project,
} from "@/features/profiles/profiles.schema";

type Profile = {
  id: string;
  name: string;
  headline: string;
  skills: Skill[] | null;
  experiences: Experience[] | null;
  education: Education[] | null;
  languages: Language[] | null;
  projects: Project[] | null;
  tjmTarget: number | null;
  workTypePreference: string | null;
  isDefault: boolean;
  portalSlug?: string | null;
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
        <ProfileCard
          key={profile.id}
          name={profile.name}
          headline={profile.headline}
          skills={profile.skills}
          experiences={profile.experiences}
          education={profile.education}
          languages={profile.languages}
          projects={profile.projects}
          tjmTarget={profile.tjmTarget}
          workTypePreference={profile.workTypePreference}
          isDefault={profile.isDefault}
          portalSlug={profile.portalSlug}
          onEdit={() => onEdit(profile)}
          onDelete={() => onDelete(profile)}
        />
      ))}
    </div>
  );
}
