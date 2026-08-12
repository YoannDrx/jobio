"use client";

import { Typography } from "@/components/nowts/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  Bookmark,
  CircleX,
  ExternalLink,
  Inbox,
  LoaderCircle,
  Plus,
  Radar,
  RefreshCw,
  SendToBack,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  convertOpportunityToMissionAction,
  createOpportunityWatchAction,
  getOrCreateOpportunityInboxAction,
  importManualOpportunityAction,
  syncOpportunityWatchAction,
  updateOpportunityMatchStatusAction,
  updateOpportunityDigestAction,
} from "../opportunities.action";

type WatchData = {
  id: string;
  name: string;
  isActive: boolean;
  lastSyncedAt: Date | null;
  sources: string[];
  sourceRuns: {
    status: string;
    fetchedCount: number;
    matchedCount: number;
    errorCode: string | null;
    startedAt: Date;
  }[];
};

type MatchData = {
  id: string;
  score: number;
  explanation: string;
  status: string;
  missionId: string | null;
  listing: {
    title: string;
    company: string | null;
    description: string | null;
    canonicalUrl: string | null;
    source: string;
    location: string | null;
    workType: string | null;
    skills: string[];
    dailyRateMin: number | null;
    dailyRateMax: number | null;
    salaryMin: number | null;
    salaryMax: number | null;
    currency: string;
    publishedAt: Date | null;
  };
};

type WorkspaceData = {
  watches: WatchData[];
  matches: MatchData[];
  total: number;
  inbox: { addressToken: string; isActive: boolean } | null;
  opportunityDigestEnabled: boolean;
};

const splitValues = (value: FormDataEntryValue | null): string[] =>
  String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const sourceLabel = (source: string): string =>
  ({
    FRANCE_TRAVAIL: "France Travail",
    ADZUNA: "Adzuna",
    JOOBLE: "Jooble",
    INBOUND_EMAIL: "Email transféré",
    MANUAL: "Import manuel",
  })[source] ?? source;

const formatCompensation = (match: MatchData): string | null => {
  const { listing } = match;
  const dailyRate = listing.dailyRateMax ?? listing.dailyRateMin;
  if (dailyRate) return `${dailyRate} ${listing.currency}/jour`;
  const salary = listing.salaryMax ?? listing.salaryMin;
  if (salary) return `${salary.toLocaleString("fr-FR")} ${listing.currency}/an`;
  return null;
};

export function OpportunitiesWorkspace({
  initialData,
  automatedDiscoveryEnabled,
}: {
  initialData: WorkspaceData;
  automatedDiscoveryEnabled: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [inboxAddress, setInboxAddress] = useState<string | null>(null);

  const run = (task: () => Promise<unknown>, success: string) => {
    startTransition(async () => {
      try {
        await task();
        toast.success(success);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Action impossible",
        );
      } finally {
        setBusyId(null);
      }
    });
  };

  const createWatch = (formData: FormData) => {
    const sources = formData.getAll("sources").map(String) as (
      | "FRANCE_TRAVAIL"
      | "ADZUNA"
      | "JOOBLE"
    )[];
    run(
      async () =>
        resolveActionResult(
          createOpportunityWatchAction({
            name: String(formData.get("name") ?? ""),
            criteria: {
              titles: splitValues(formData.get("titles")),
              skills: splitValues(formData.get("skills")),
              location: String(formData.get("location") ?? "") || undefined,
              workTypes: formData.getAll("workTypes").map(String) as (
                | "REMOTE"
                | "HYBRID"
                | "ONSITE"
              )[],
              minDailyRate: formData.get("minDailyRate")
                ? Number(formData.get("minDailyRate"))
                : undefined,
              excludedKeywords: splitValues(formData.get("excludedKeywords")),
            },
            sources,
          }),
        ),
      "Veille créée",
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radar className="size-5" aria-hidden="true" />
              Veilles automatisées
            </CardTitle>
            <CardDescription>
              Synchronisation quotidienne. Les résultats restent dans le Radar
              tant que tu ne les convertis pas explicitement.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!automatedDiscoveryEnabled ? (
              <div className="rounded-lg border border-dashed p-4">
                <Typography variant="large">Disponible avec Pro</Typography>
                <Typography variant="muted">
                  L’import manuel reste accessible. Pro ajoute les sources
                  autorisées, le digest et le scoring continu.
                </Typography>
              </div>
            ) : (
              <form action={createWatch} className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="watch-name">Nom de la veille</Label>
                  <Input
                    id="watch-name"
                    name="name"
                    placeholder="Missions React senior"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="watch-titles">
                    Intitulés, séparés par des virgules
                  </Label>
                  <Input
                    id="watch-titles"
                    name="titles"
                    placeholder="Lead developer, Frontend engineer"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="watch-skills">Compétences</Label>
                  <Input
                    id="watch-skills"
                    name="skills"
                    placeholder="React, TypeScript, Next.js"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="watch-location">Zone</Label>
                  <Input
                    id="watch-location"
                    name="location"
                    placeholder="Paris ou France"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="watch-rate">TJM minimum</Label>
                  <Input
                    id="watch-rate"
                    name="minDailyRate"
                    type="number"
                    min="1"
                    max="10000"
                    placeholder="600"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="watch-excluded">Mots exclus</Label>
                  <Input
                    id="watch-excluded"
                    name="excludedKeywords"
                    placeholder="stage, alternance"
                  />
                </div>
                <fieldset className="flex flex-col gap-2">
                  <Typography as="legend" variant="small">
                    Mode de travail
                  </Typography>
                  <div className="flex flex-wrap gap-3">
                    {[
                      ["REMOTE", "Remote"],
                      ["HYBRID", "Hybride"],
                      ["ONSITE", "Sur site"],
                    ].map(([value, label]) => (
                      <Label
                        key={value}
                        className="flex items-center gap-2 font-normal"
                      >
                        <input type="checkbox" name="workTypes" value={value} />{" "}
                        {label}
                      </Label>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="flex flex-col gap-2">
                  <Typography as="legend" variant="small">
                    Sources
                  </Typography>
                  <div className="flex flex-wrap gap-3">
                    {[
                      ["FRANCE_TRAVAIL", "France Travail"],
                      ["ADZUNA", "Adzuna"],
                      ["JOOBLE", "Jooble"],
                    ].map(([value, label], index) => (
                      <Label
                        key={value}
                        className="flex items-center gap-2 font-normal"
                      >
                        <input
                          type="checkbox"
                          name="sources"
                          value={value}
                          defaultChecked={index === 0}
                        />{" "}
                        {label}
                      </Label>
                    ))}
                  </div>
                </fieldset>
                <div className="md:col-span-2">
                  <Button type="submit" disabled={isPending}>
                    <Plus className="size-4" aria-hidden="true" /> Créer la
                    veille
                  </Button>
                </div>
              </form>
            )}

            {initialData.watches.map((watch) => {
              const lastRun = watch.sourceRuns.at(0);
              return (
                <div
                  key={watch.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <Typography variant="large">{watch.name}</Typography>
                    <Typography variant="muted">
                      {watch.sources.map(sourceLabel).join(" · ")}
                      {lastRun
                        ? ` — dernier run ${lastRun.status.toLowerCase()}, ${lastRun.matchedCount} match(s)`
                        : " — jamais synchronisée"}
                    </Typography>
                  </div>
                  <Button
                    variant="outline"
                    disabled={isPending || !watch.isActive}
                    onClick={() => {
                      setBusyId(watch.id);
                      run(
                        async () =>
                          resolveActionResult(
                            syncOpportunityWatchAction({ id: watch.id }),
                          ),
                        "Veille synchronisée",
                      );
                    }}
                  >
                    {busyId === watch.id ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="size-4" />
                    )}
                    Synchroniser
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Importer une annonce</CardTitle>
              <CardDescription>
                Colle le texte d’une annonce. Aucun ajout au pipeline ne sera
                automatique.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                action={async (formData) =>
                  run(
                    async () =>
                      resolveActionResult(
                        importManualOpportunityAction({
                          content: String(formData.get("content") ?? ""),
                          sourceUrl:
                            String(formData.get("sourceUrl") ?? "") ||
                            undefined,
                        }),
                      ),
                    "Annonce analysée et ajoutée au Radar",
                  )
                }
                className="flex flex-col gap-3"
              >
                <Label htmlFor="opportunity-content">
                  Contenu de l’annonce
                </Label>
                <Textarea
                  id="opportunity-content"
                  name="content"
                  minLength={30}
                  maxLength={50000}
                  rows={7}
                  placeholder="Titre puis contenu de l’annonce…"
                  required
                />
                <Label htmlFor="opportunity-source-url">
                  URL source (facultative)
                </Label>
                <Input
                  id="opportunity-source-url"
                  name="sourceUrl"
                  type="url"
                  placeholder="https://source.example/offre (facultatif)"
                />
                <Button type="submit" variant="secondary" disabled={isPending}>
                  Analyser l’annonce
                </Button>
              </form>
            </CardContent>
          </Card>

          {automatedDiscoveryEnabled ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Inbox className="size-5" /> Alertes par email
                </CardTitle>
                <CardDescription>
                  Transfère tes alertes vers une adresse unique Jobio. Les
                  pièces jointes sont ignorées.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {inboxAddress ? (
                  <Typography variant="code" className="break-all">
                    {inboxAddress}
                  </Typography>
                ) : null}
                <Button
                  variant="outline"
                  disabled={isPending}
                  onClick={() =>
                    run(async () => {
                      const inbox = await resolveActionResult(
                        getOrCreateOpportunityInboxAction({}),
                      );
                      setInboxAddress(inbox.address);
                    }, "Adresse de transfert prête")
                  }
                >
                  Générer mon adresse
                </Button>
                <Label className="flex items-center gap-2 font-normal">
                  <input
                    type="checkbox"
                    checked={initialData.opportunityDigestEnabled}
                    disabled={isPending}
                    onChange={(event) =>
                      run(
                        async () =>
                          resolveActionResult(
                            updateOpportunityDigestAction({
                              enabled: event.target.checked,
                            }),
                          ),
                        event.target.checked
                          ? "Digest quotidien activé"
                          : "Digest quotidien désactivé",
                      )
                    }
                  />
                  Recevoir un digest lorsqu’il y a de nouvelles opportunités
                </Label>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <section aria-labelledby="radar-results" className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <Typography id="radar-results" variant="h3">
            Opportunités ({initialData.total})
          </Typography>
          <Typography variant="muted">Score explicable, de 0 à 100</Typography>
        </div>
        {initialData.matches.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <Radar className="text-muted-foreground size-8" />
              <Typography variant="large">
                Aucune opportunité pour le moment
              </Typography>
              <Typography variant="muted">
                Importe une annonce ou synchronise une veille pour alimenter ce
                tableau.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {initialData.matches.map((match) => {
              const compensation = formatCompensation(match);
              return (
                <Card
                  key={match.id}
                  className={
                    match.status === "DISMISSED" ? "opacity-60" : undefined
                  }
                >
                  <CardHeader className="gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <CardTitle>
                          <Typography as="h4" variant="large">
                            {match.listing.title}
                          </Typography>
                        </CardTitle>
                        <CardDescription>
                          {match.listing.company ?? "Entreprise non renseignée"}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={match.score >= 70 ? "default" : "secondary"}
                      >
                        {match.score}/100
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        {sourceLabel(match.listing.source)}
                      </Badge>
                      {match.listing.workType ? (
                        <Badge variant="outline">
                          {match.listing.workType}
                        </Badge>
                      ) : null}
                      {match.listing.location ? (
                        <Badge variant="outline">
                          {match.listing.location}
                        </Badge>
                      ) : null}
                      {compensation ? (
                        <Badge variant="outline">{compensation}</Badge>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <Typography>{match.explanation}</Typography>
                    {match.listing.skills.length > 0 ? (
                      <Typography variant="muted">
                        {match.listing.skills.slice(0, 8).join(" · ")}
                      </Typography>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      {match.listing.canonicalUrl ? (
                        <Button asChild variant="ghost" size="sm">
                          <a
                            href={match.listing.canonicalUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Source <ExternalLink className="size-4" />
                          </a>
                        </Button>
                      ) : null}
                      {match.status !== "CONVERTED" ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() =>
                              run(
                                async () =>
                                  resolveActionResult(
                                    updateOpportunityMatchStatusAction({
                                      id: match.id,
                                      status: "SAVED",
                                    }),
                                  ),
                                "Opportunité enregistrée",
                              )
                            }
                          >
                            <Bookmark className="size-4" /> Enregistrer
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isPending}
                            onClick={() =>
                              run(
                                async () =>
                                  resolveActionResult(
                                    updateOpportunityMatchStatusAction({
                                      id: match.id,
                                      status: "DISMISSED",
                                      feedback: "Écartée depuis le Radar",
                                    }),
                                  ),
                                "Opportunité écartée",
                              )
                            }
                          >
                            <CircleX className="size-4" /> Écarter
                          </Button>
                          <Button
                            size="sm"
                            disabled={isPending}
                            onClick={() =>
                              run(
                                async () =>
                                  resolveActionResult(
                                    convertOpportunityToMissionAction({
                                      id: match.id,
                                    }),
                                  ),
                                "Mission ajoutée au pipeline",
                              )
                            }
                          >
                            <SendToBack className="size-4" /> Ajouter au
                            pipeline
                          </Button>
                        </>
                      ) : (
                        <Badge>Dans le pipeline</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
