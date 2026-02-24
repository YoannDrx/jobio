"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import {
  getCalendarEventsAction,
  type CalendarEvent,
} from "@/features/calendar/calendar.action";
import { getOrCreateFeedTokenAction } from "@/features/calendar/calendar-feed.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { getServerUrl } from "@/lib/server-url";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { FeatureGuide } from "@/components/nowts/feature-guide";

const DAYS_OF_WEEK = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const MONTH_NAMES = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

type DayCell = {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
};

function buildCalendarGrid(
  year: number,
  month: number,
  events: CalendarEvent[],
): DayCell[] {
  const firstDay = new Date(year, month, 1);
  // Monday = 0, Sunday = 6
  let startDayOfWeek = firstDay.getDay() - 1;
  if (startDayOfWeek < 0) startDayOfWeek = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  const cells: DayCell[] = [];

  // Previous month trailing days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    cells.push({
      date: daysInPrevMonth - i,
      isCurrentMonth: false,
      isToday: false,
      events: [],
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = events.filter((e) => {
      const eventDate = new Date(e.date);
      return eventDate.getDate() === day;
    });

    cells.push({
      date: day,
      isCurrentMonth: true,
      isToday: isCurrentMonth && today.getDate() === day,
      events: dayEvents,
    });
  }

  // Next month leading days
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      cells.push({
        date: i,
        isCurrentMonth: false,
        isToday: false,
        events: [],
      });
    }
  }

  return cells;
}

export default function CalendarPage() {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayCell | null>(null);

  const fetchEvents = useCallback(async (year: number, month: number) => {
    setIsLoading(true);
    try {
      const result = await resolveActionResult(
        getCalendarEventsAction({ month: month + 1, year }),
      );
      setEvents(result);
    } catch {
      toast.error("Erreur lors du chargement des événements");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEvents(currentYear, currentMonth);
  }, [currentYear, currentMonth, fetchEvents]);

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const handleCopyIcsLink = async () => {
    try {
      const result = await resolveActionResult(getOrCreateFeedTokenAction());
      const url = `${getServerUrl()}/api/calendar/ics?token=${result.token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Lien ICS copié dans le presse-papier");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erreur lors de la génération du lien ICS");
    }
  };

  const grid = buildCalendarGrid(currentYear, currentMonth, events);

  return (
    <Layout>
      <LayoutHeader>
        <div className="flex items-center gap-1">
          <LayoutTitle>Calendrier</LayoutTitle>
          <FeatureGuide title="Calendrier ICS">
            <p>
              Abonne-toi au flux ICS pour synchroniser tes relances et
              entretiens avec ton calendrier.
            </p>
            <p>
              <strong>Google Calendar</strong> : Paramètres → Ajouter par URL.
            </p>
            <p>
              <strong>Apple Calendar</strong> : Fichier → Nouveau calendrier par
              abonnement.
            </p>
          </FeatureGuide>
        </div>
      </LayoutHeader>
      <LayoutActions>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyIcsLink}>
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            <span className="hidden sm:inline">
              {copied ? "Copié" : "Lien ICS"}
            </span>
          </Button>
        </div>
      </LayoutActions>
      <LayoutContent>
        <Card className="p-4">
          {/* Month navigation */}
          <div className="mb-4 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="size-5" />
            </Button>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h2>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Aujourd&apos;hui
              </Button>
            </div>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="size-5" />
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-7 gap-1">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="text-muted-foreground py-2 text-center text-xs font-medium"
                >
                  {day}
                </div>
              ))}
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="text-muted-foreground py-2 text-center text-xs font-medium"
                >
                  {day}
                </div>
              ))}

              {/* Day cells */}
              {grid.map((cell, index) => (
                <Popover
                  key={index}
                  open={
                    selectedDay?.date === cell.date &&
                    selectedDay.isCurrentMonth === cell.isCurrentMonth &&
                    cell.events.length > 0
                  }
                  onOpenChange={(open) => {
                    if (!open) setSelectedDay(null);
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      onClick={() => {
                        if (cell.events.length > 0) {
                          setSelectedDay(cell);
                        }
                      }}
                      className={`flex min-h-20 flex-col rounded-md border p-1 text-left transition-colors ${
                        cell.isCurrentMonth
                          ? "bg-background hover:bg-muted/50"
                          : "bg-muted/30 text-muted-foreground"
                      } ${cell.isToday ? "border-primary ring-primary/20 ring-2" : "border-border"} ${cell.events.length > 0 ? "cursor-pointer" : "cursor-default"}`}
                    >
                      <span
                        className={`text-xs font-medium ${
                          cell.isToday
                            ? "bg-primary text-primary-foreground inline-flex size-5 items-center justify-center rounded-full"
                            : ""
                        }`}
                      >
                        {cell.date}
                      </span>
                      <div className="mt-0.5 flex flex-col gap-0.5">
                        {cell.events.length <= 2 ? (
                          cell.events.map((event) => (
                            <div
                              key={event.id}
                              className="flex items-center gap-1"
                            >
                              <span
                                className={`size-1.5 shrink-0 rounded-full ${event.completed ? "bg-emerald-500" : "bg-blue-500"}`}
                              />
                              <span className="truncate text-[10px] leading-tight">
                                {event.title}
                              </span>
                            </div>
                          ))
                        ) : (
                          <>
                            <div className="flex items-center gap-1">
                              <span
                                className={`size-1.5 shrink-0 rounded-full ${cell.events[0].completed ? "bg-emerald-500" : "bg-blue-500"}`}
                              />
                              <span className="truncate text-[10px] leading-tight">
                                {cell.events[0].title}
                              </span>
                            </div>
                            <Badge
                              variant="secondary"
                              className="mt-0.5 h-4 w-fit px-1 text-[10px]"
                            >
                              +{cell.events.length - 1} autres
                            </Badge>
                          </>
                        )}
                      </div>
                    </button>
                  </PopoverTrigger>
                  {cell.events.length > 0 && (
                    <PopoverContent
                      className="w-72"
                      align="start"
                      side="bottom"
                    >
                      <div className="flex flex-col gap-2">
                        <p className="text-sm font-semibold">
                          {cell.date} {MONTH_NAMES[currentMonth]}
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {cell.events.map((event) => (
                            <div
                              key={event.id}
                              className="flex items-start gap-2 rounded-md border p-2"
                            >
                              <span
                                className={`mt-1 size-2 shrink-0 rounded-full ${event.completed ? "bg-emerald-500" : "bg-blue-500"}`}
                              />
                              <div className="flex min-w-0 flex-col gap-0.5">
                                <p className="truncate text-sm font-medium">
                                  {event.title}
                                </p>
                                {event.missionTitle && (
                                  <Link
                                    href={`/app/pipeline`}
                                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
                                  >
                                    <ExternalLink className="size-3" />
                                    {event.missionTitle}
                                  </Link>
                                )}
                                <p className="text-muted-foreground text-xs">
                                  {new Date(event.date).toLocaleTimeString(
                                    "fr-FR",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                  {event.completed && (
                                    <span className="ml-2 text-emerald-500">
                                      Completee
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  )}
                </Popover>
              ))}
            </div>
          )}
        </Card>
      </LayoutContent>
    </Layout>
  );
}
