"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AnalyticsEvents, track } from "@/lib/analytics";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  createFollowUpAction,
  updateFollowUpAction,
} from "@/features/follow-ups/follow-ups.action";
import {
  createMissionAction,
  updateMissionAction,
} from "@/features/missions/missions.action";
import {
  createProfileAction,
  updateProfileAction,
} from "@/features/profiles/profiles.action";
import { dismissOnboardingAction } from "@/features/onboarding/onboarding.action";
import { parseOnboardingSkillInput } from "@/features/onboarding/onboarding-state";

type OnboardingStep = 1 | 2 | 3 | 4;
type WorkType = "REMOTE" | "HYBRID" | "ONSITE";
type MissionStatus =
  | "A_POSTULER"
  | "POSTULE"
  | "ENTRETIEN"
  | "PROPOSITION";
type FollowUpType = "EMAIL" | "CALL" | "MESSAGE" | "MEETING";

type InitialOnboardingState = {
  suggestedStep: number;
  profile: {
    id: string;
    headline: string;
    tjmTarget: number | null;
    workTypePreference: WorkType | null;
    skills: string[];
  } | null;
  mission: {
    id: string;
    title: string;
    company: string | null;
    status: string;
    isExample: boolean;
  } | null;
  followUp: {
    id: string;
    title: string;
    type: FollowUpType;
    scheduledAt: string;
  } | null;
};

type OnboardingNewUserWizardProps = {
  user: {
    id: string;
    name: string | null | undefined;
    email: string;
  };
  initialState: InitialOnboardingState;
};

const MISSION_STATUSES: { value: MissionStatus; label: string }[] = [
  { value: "A_POSTULER", label: "À qualifier" },
  { value: "POSTULE", label: "Candidature envoyée" },
  { value: "ENTRETIEN", label: "Entretien" },
  { value: "PROPOSITION", label: "Proposition" },
];

const FOLLOW_UP_TYPES: { value: FollowUpType; label: string }[] = [
  { value: "EMAIL", label: "Email" },
  { value: "MESSAGE", label: "Message" },
  { value: "CALL", label: "Appel" },
  { value: "MEETING", label: "Rendez-vous" },
];

const toLocalDateTimeInput = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  if (!value) {
    date.setDate(date.getDate() + 1);
    date.setHours(9, 0, 0, 0);
  }
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

const readableError = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Une erreur est survenue. Tes données déjà enregistrées sont conservées.";

export function OnboardingNewUserWizard({
  user,
  initialState,
}: OnboardingNewUserWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    Math.min(Math.max(initialState.suggestedStep, 1), 4) as OnboardingStep,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [profileId, setProfileId] = useState(initialState.profile?.id ?? null);
  const [missionId, setMissionId] = useState(initialState.mission?.id ?? null);
  const [followUpId, setFollowUpId] = useState(
    initialState.followUp?.id ?? null,
  );

  const [headline, setHeadline] = useState(
    initialState.profile?.headline ?? "Développeur React / Next.js",
  );
  const [tjm, setTjm] = useState(
    initialState.profile?.tjmTarget?.toString() ?? "",
  );
  const [workType, setWorkType] = useState<WorkType>(
    initialState.profile?.workTypePreference ?? "REMOTE",
  );
  const [skillsText, setSkillsText] = useState(
    initialState.profile?.skills.join(", ") ?? "",
  );

  const [missionTitle, setMissionTitle] = useState(
    initialState.mission?.title ?? "",
  );
  const [missionCompany, setMissionCompany] = useState(
    initialState.mission?.company ?? "",
  );
  const [missionStatus, setMissionStatus] = useState<MissionStatus>(
    MISSION_STATUSES.some(
      (status) => status.value === initialState.mission?.status,
    )
      ? (initialState.mission?.status as MissionStatus)
      : "A_POSTULER",
  );
  const [isExampleMission, setIsExampleMission] = useState(
    initialState.mission?.isExample ?? false,
  );

  const [followUpTitle, setFollowUpTitle] = useState(
    initialState.followUp?.title ?? "Relancer sur l'opportunité",
  );
  const [followUpType, setFollowUpType] = useState<FollowUpType>(
    initialState.followUp?.type ?? "EMAIL",
  );
  const [followUpAt, setFollowUpAt] = useState(
    toLocalDateTimeInput(initialState.followUp?.scheduledAt),
  );

  const skills = parseOnboardingSkillInput(skillsText);

  const saveProfile = async () => {
    if (headline.trim().length < 2) {
      throw new Error("Décris le type de mission que tu recherches.");
    }

    const profileData = {
      headline: headline.trim(),
      tjmTarget: tjm ? Number(tjm) : undefined,
      workTypePreference: workType,
      skills,
    };

    if (profileId) {
      const profile = await resolveActionResult(
        updateProfileAction({
          id: profileId,
          ...profileData,
          tjmTarget: tjm ? Number(tjm) : null,
        }),
      );
      setProfileId(profile.id);
      return profile.id;
    }

    const trimmedUserName = user.name?.trim();
    const profile = await resolveActionResult(
      createProfileAction({
        name: `${trimmedUserName?.length ? trimmedUserName : "Mon profil"} — profil maître`,
        ...profileData,
        experiences: [],
        education: [],
        certifications: [],
        languages: [],
        projects: [],
        isDefault: true,
      }),
    );
    setProfileId(profile.id);
    return profile.id;
  };

  const saveMission = async () => {
    if (!missionTitle.trim()) {
      throw new Error("Ajoute une opportunité réelle ou utilise l'exemple.");
    }

    const data = {
      title: missionTitle.trim(),
      company: missionCompany.trim(),
      status: missionStatus,
      profileId: profileId ?? undefined,
      notes: isExampleMission
        ? "[JOBIO_EXAMPLE] Opportunité fictive créée pendant l'onboarding."
        : undefined,
    };

    if (missionId) {
      const mission = await resolveActionResult(
        updateMissionAction({
          id: missionId,
          ...data,
          notes: data.notes ?? null,
        }),
      );
      setMissionId(mission.id);
      return mission.id;
    }

    const mission = await resolveActionResult(
      createMissionAction({
        ...data,
        stack: skills.map((skill) => skill.name),
        priority: "MEDIUM",
        score: 0,
      }),
    );
    setMissionId(mission.id);
    track(AnalyticsEvents.FIRST_MISSION_CREATED, { source: "onboarding" });
    return mission.id;
  };

  const saveFollowUp = async () => {
    if (!missionId) throw new Error("La mission doit être enregistrée d'abord.");
    if (!followUpTitle.trim()) throw new Error("Nomme ta prochaine action.");

    const scheduledAt = new Date(followUpAt);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
      throw new Error("Choisis une date de relance dans le futur.");
    }

    if (followUpId) {
      const followUp = await resolveActionResult(
        updateFollowUpAction({
          id: followUpId,
          title: followUpTitle.trim(),
          type: followUpType,
          scheduledAt,
        }),
      );
      setFollowUpId(followUp.id);
      return;
    }

    const followUp = await resolveActionResult(
      createFollowUpAction({
        missionId,
        title: followUpTitle.trim(),
        type: followUpType,
        scheduledAt,
      }),
    );
    setFollowUpId(followUp.id);
    track(AnalyticsEvents.FIRST_FOLLOW_UP_PLANNED, {
      source: "onboarding",
    });
  };

  const handleNext = async () => {
    setIsLoading(true);
    try {
      if (currentStep === 1) {
        await saveProfile();
        track(AnalyticsEvents.ONBOARDING_STEP_COMPLETED, { step: 1 });
        setCurrentStep(2);
      } else if (currentStep === 2) {
        if (skills.length === 0) {
          throw new Error("Ajoute au moins une compétence principale.");
        }
        await saveProfile();
        track(AnalyticsEvents.ONBOARDING_STEP_COMPLETED, { step: 2 });
        setCurrentStep(3);
      } else if (currentStep === 3) {
        await saveMission();
        track(AnalyticsEvents.ONBOARDING_STEP_COMPLETED, { step: 3 });
        setCurrentStep(4);
      } else {
        await saveFollowUp();
        await resolveActionResult(dismissOnboardingAction());
        track(AnalyticsEvents.ONBOARDING_STEP_COMPLETED, { step: 4 });
        track(AnalyticsEvents.ONBOARDING_COMPLETED, {
          has_example_mission: isExampleMission,
        });
        toast.success("Ton cockpit commercial est prêt.");
        router.replace("/job");
        router.refresh();
      }
    } catch (error) {
      toast.error(readableError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const useExampleMission = () => {
    setMissionTitle("Exemple — Refonte d'une application React");
    setMissionCompany("Entreprise fictive");
    setMissionStatus("A_POSTULER");
    setIsExampleMission(true);
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-6 flex items-center justify-between gap-3" aria-label="Progression de l'onboarding">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex flex-1 items-center gap-3">
            <div
              className={`flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${
                step < currentStep
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : step === currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted text-muted-foreground"
              }`}
              aria-current={step === currentStep ? "step" : undefined}
            >
              {step < currentStep ? <Check className="size-4" /> : step}
            </div>
            {step < 4 ? (
              <div className={`h-0.5 flex-1 ${step < currentStep ? "bg-emerald-600" : "bg-border"}`} />
            ) : null}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader className="gap-2">
          <p className="text-primary text-sm font-semibold">Étape {currentStep} sur 4 · environ 5 minutes</p>
          <CardTitle role="heading" aria-level={1} className="text-2xl">
            {currentStep === 1 ? "Ton cap commercial" : null}
            {currentStep === 2 ? "Tes compétences principales" : null}
            {currentStep === 3 ? "Ta première opportunité" : null}
            {currentStep === 4 ? "Ta prochaine action" : null}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          {currentStep === 1 ? (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="headline">Quel type de mission recherches-tu ?</Label>
                <Input id="headline" value={headline} onChange={(event) => setHeadline(event.target.value)} placeholder="Développeur React / Next.js" autoFocus />
                <p className="text-muted-foreground text-sm">Un intitulé clair suffit. Tu enrichiras ton CV plus tard.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tjm">TJM cible (optionnel)</Label>
                  <Input id="tjm" type="number" min={1} inputMode="numeric" value={tjm} onChange={(event) => setTjm(event.target.value)} placeholder="550" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="workType">Mode de travail préféré</Label>
                  <Select value={workType} onValueChange={(value) => setWorkType(value as WorkType)}>
                    <SelectTrigger id="workType"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REMOTE">À distance</SelectItem>
                      <SelectItem value="HYBRID">Hybride</SelectItem>
                      <SelectItem value="ONSITE">Sur site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          ) : null}

          {currentStep === 2 ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="skills">Compétences à mettre en avant</Label>
              <Textarea id="skills" value={skillsText} onChange={(event) => setSkillsText(event.target.value)} placeholder="React, Next.js, TypeScript" className="min-h-28" autoFocus />
              <p className="text-muted-foreground text-sm">Sépare-les par des virgules. Huit compétences maximum.</p>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2" aria-label="Compétences détectées">
                  {skills.map((skill) => <span key={skill.name} className="bg-muted rounded-full px-3 py-1 text-sm">{skill.name}</span>)}
                </div>
              ) : null}
            </div>
          ) : null}

          {currentStep === 3 ? (
            <>
              <div className="rounded-xl border border-dashed p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">Pas encore d'opportunité réelle ?</p>
                    <p className="text-muted-foreground text-sm">Crée un exemple clairement étiqueté, supprimable ensuite.</p>
                  </div>
                  <Button type="button" variant="outline" onClick={useExampleMission} className="gap-2">
                    <Sparkles className="size-4" /> Utiliser un exemple
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="missionTitle">Mission</Label>
                <Input id="missionTitle" value={missionTitle} onChange={(event) => { setMissionTitle(event.target.value); setIsExampleMission(false); }} placeholder="Développement d'un dashboard React" autoFocus />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="missionCompany">Entreprise (optionnel)</Label>
                  <Input id="missionCompany" value={missionCompany} onChange={(event) => setMissionCompany(event.target.value)} placeholder="Nom de l'entreprise" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="missionStatus">Où en es-tu ?</Label>
                  <Select value={missionStatus} onValueChange={(value) => setMissionStatus(value as MissionStatus)}>
                    <SelectTrigger id="missionStatus"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MISSION_STATUSES.map((status) => <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {isExampleMission ? <p className="text-amber-700 text-sm">Cette mission sera enregistrée comme donnée fictive.</p> : null}
            </>
          ) : null}

          {currentStep === 4 ? (
            <>
              <p className="text-muted-foreground text-sm">Programme maintenant la prochaine action pour que Jobio sache quoi te proposer dans Aujourd'hui.</p>
              <div className="flex flex-col gap-2">
                <Label htmlFor="followUpTitle">Action à réaliser</Label>
                <Input id="followUpTitle" value={followUpTitle} onChange={(event) => setFollowUpTitle(event.target.value)} autoFocus />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="followUpType">Canal</Label>
                  <Select value={followUpType} onValueChange={(value) => setFollowUpType(value as FollowUpType)}>
                    <SelectTrigger id="followUpType"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FOLLOW_UP_TYPES.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="followUpAt">Quand ?</Label>
                  <Input id="followUpAt" type="datetime-local" value={followUpAt} onChange={(event) => setFollowUpAt(event.target.value)} />
                </div>
              </div>
            </>
          ) : null}

          <div className="flex items-center justify-between gap-3 border-t pt-5">
            <Button type="button" variant="ghost" onClick={() => setCurrentStep((step) => Math.max(1, step - 1) as OnboardingStep)} disabled={currentStep === 1 || isLoading} className="gap-2">
              <ChevronLeft className="size-4" /> Retour
            </Button>
            <Button type="button" onClick={() => void handleNext()} disabled={isLoading} className="gap-2">
              {isLoading ? "Enregistrement…" : currentStep === 4 ? "Planifier et ouvrir Aujourd'hui" : "Enregistrer et continuer"}
              {!isLoading ? <ChevronRight className="size-4" /> : null}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
