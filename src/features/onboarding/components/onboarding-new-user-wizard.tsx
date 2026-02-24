"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Check, ChevronRight } from "lucide-react";
type OnboardingStep = 1 | 2 | 3 | 4;

type PlatformOption = {
  id: string;
  name: string;
  icon?: string;
};

type MissionStatus =
  | "lead"
  | "proposal"
  | "negotiation"
  | "signed"
  | "completed"
  | "lost";

const PLATFORMS: PlatformOption[] = [
  { id: "malt", name: "Malt" },
  { id: "upwork", name: "Upwork" },
  { id: "linkedin", name: "LinkedIn" },
  { id: "comet", name: "Comet" },
  { id: "freelance", name: "Freelance.com" },
  { id: "toptal", name: "Toptal" },
  { id: "remoteok", name: "RemoteOK" },
  { id: "expert", name: "Expert" },
];

const MISSION_STATUSES: { value: MissionStatus; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "proposal", label: "Proposition" },
  { value: "negotiation", label: "Négociation" },
  { value: "signed", label: "Signée" },
  { value: "completed", label: "Complétée" },
  { value: "lost", label: "Perdue" },
];

type OnboardingNewUserWizardProps = {
  user: {
    id: string;
    name: string | null | undefined;
    email: string;
  };
};

export function OnboardingNewUserWizard({
  user,
}: OnboardingNewUserWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1 state
  const [firstName, setFirstName] = useState(user.name?.split(" ")[0] ?? "");
  const [tjm, setTjm] = useState("");
  const [stack, setStack] = useState("");

  // Step 2 state
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  // Step 3 state
  const [missionTitle, setMissionTitle] = useState("");
  const [missionCompany, setMissionCompany] = useState("");
  const [missionStatus, setMissionStatus] = useState<MissionStatus>("lead");

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId],
    );
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!firstName.trim()) {
        toast.error("Veuillez entrer votre prénom");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (selectedPlatforms.length === 0) {
        toast.error("Veuillez sélectionner au moins une plateforme");
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else {
      setIsLoading(true);
      try {
        // Redirect to /job
        router.push("/job");
      } catch {
        toast.error("Erreur lors de la redirection");
        setIsLoading(false);
      }
    }
  };

  const handleSkipStep3 = () => {
    setCurrentStep(4);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as OnboardingStep);
    }
  };

  return (
    <div className="w-full max-w-lg">
      {/* Step indicators */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`flex size-8 items-center justify-center rounded-full font-semibold transition-all ${
                  step < currentStep
                    ? "bg-emerald-500 text-white"
                    : step === currentStep
                      ? "bg-cyan-500 text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step < currentStep ? (
                  <Check className="size-4" />
                ) : (
                  <span>{step}</span>
                )}
              </div>
              {step < 4 && (
                <div
                  className={`mx-2 h-1 w-8 transition-all ${
                    step < currentStep ? "bg-emerald-500" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          {currentStep === 1 && <CardTitle>Ton profil</CardTitle>}
          {currentStep === 2 && <CardTitle>Tes plateformes</CardTitle>}
          {currentStep === 3 && <CardTitle>Ta première mission</CardTitle>}
          {currentStep === 4 && <CardTitle>Bienvenue dans Jobio !</CardTitle>}
        </CardHeader>

        <CardContent>
          {/* Step 1: Profile */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  placeholder="Ton prénom"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tjm">TJM cible</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="tjm"
                    type="number"
                    placeholder="450"
                    value={tjm}
                    onChange={(e) => setTjm(e.target.value)}
                  />
                  <span className="text-muted-foreground text-sm">€/jour</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stack">Stack principale</Label>
                <Textarea
                  id="stack"
                  placeholder="React, Node.js, TypeScript..."
                  value={stack}
                  onChange={(e) => setStack(e.target.value)}
                  className="min-h-24"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button onClick={handleNext} className="gap-2">
                  Continuer <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Platforms */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <p className="text-muted-foreground text-sm">
                Sélectionne les plateformes où tu prospèctes
              </p>

              <div className="grid grid-cols-2 gap-3">
                {PLATFORMS.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => handlePlatformToggle(platform.id)}
                    className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                      selectedPlatforms.includes(platform.id)
                        ? "border-cyan-500 bg-cyan-50 text-cyan-900 dark:bg-cyan-950/20 dark:text-cyan-100"
                        : "border-muted text-foreground hover:border-muted-foreground bg-transparent"
                    }`}
                  >
                    {platform.name}
                  </button>
                ))}
              </div>

              <div className="flex justify-between gap-3 pt-4">
                <Button variant="outline" onClick={handleBack}>
                  Retour
                </Button>
                <Button onClick={handleNext} className="gap-2">
                  Continuer <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: First mission */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="missionTitle">Titre de la mission</Label>
                <Input
                  id="missionTitle"
                  placeholder="Ex: Développement React pour startup"
                  value={missionTitle}
                  onChange={(e) => setMissionTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="missionCompany">Entreprise (optionnel)</Label>
                <Input
                  id="missionCompany"
                  placeholder="Nom de l'entreprise"
                  value={missionCompany}
                  onChange={(e) => setMissionCompany(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="missionStatus">Statut</Label>
                <Select
                  value={missionStatus}
                  onValueChange={(value) =>
                    setMissionStatus(value as MissionStatus)
                  }
                >
                  <SelectTrigger id="missionStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MISSION_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between gap-3 pt-4">
                <Button variant="outline" onClick={handleBack}>
                  Retour
                </Button>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={handleSkipStep3}>
                    Passer cette étape
                  </Button>
                  <Button onClick={handleNext} className="gap-2">
                    Continuer <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Welcome */}
          {currentStep !== 4 ? null : (
            <div className="space-y-6 py-6 text-center">
              <div className="space-y-3">
                <div className="text-5xl">🎉</div>
                <h3 className="text-2xl font-bold">Bienvenue {firstName} !</h3>
                <p className="text-muted-foreground">
                  Tu es maintenant prêt à explorer Jobio et trouver tes
                  prochaines missions.
                </p>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleNext}
                  disabled={isLoading}
                  className="gap-2"
                >
                  Commencer <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
