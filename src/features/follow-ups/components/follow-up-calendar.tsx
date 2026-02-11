"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type FollowUpForCalendar = {
  id: string;
  title: string;
  type: string;
  scheduledAt: Date;
  completedAt: Date | null;
  mission: {
    title: string;
    company: string | null;
  };
};

type FollowUpCalendarProps = {
  followUps: FollowUpForCalendar[];
};

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

const DAY_NAMES = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const TYPE_COLORS: Record<string, string> = {
  EMAIL: "bg-blue-500",
  CALL: "bg-green-500",
  MESSAGE: "bg-purple-500",
  MEETING: "bg-orange-500",
};

export function FollowUpCalendar({ followUps }: FollowUpCalendarProps) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const startingDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getFollowUpsForDay = (day: number) => {
    return followUps.filter((fu) => {
      const fuDate = new Date(fu.scheduledAt);
      return (
        fuDate.getFullYear() === currentYear &&
        fuDate.getMonth() === currentMonth &&
        fuDate.getDate() === day
      );
    });
  };

  const isToday = (day: number) => {
    return (
      day === now.getDate() &&
      currentMonth === now.getMonth() &&
      currentYear === now.getFullYear()
    );
  };

  const days: (number | null)[] = [];
  for (let i = 0; i < startingDayIndex; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="border-border bg-card w-full rounded-lg border p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevMonth}
            className="size-9 p-0"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextMonth}
            className="size-9 p-0"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            className="text-muted-foreground py-2 text-center text-sm font-semibold"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const dayFollowUps = day ? getFollowUpsForDay(day) : [];
          const isTodayDate = day ? isToday(day) : false;

          return (
            <div
              key={idx}
              className={cn(
                "flex aspect-square flex-col items-start justify-start overflow-hidden rounded-lg border p-2 transition-colors",
                day === null
                  ? "border-transparent bg-transparent"
                  : "border-border bg-background hover:bg-muted cursor-default",
                isTodayDate &&
                  "border-primary bg-primary/5 ring-primary ring-1",
              )}
            >
              {day && (
                <>
                  <span className="text-foreground text-xs font-semibold">
                    {day}
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {dayFollowUps.map((fu) => (
                      <Tooltip key={fu.id}>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "size-2 cursor-pointer rounded-full p-0",
                              TYPE_COLORS[fu.type] || "bg-gray-500",
                              fu.completedAt && "line-through opacity-50",
                            )}
                            title={fu.title}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">
                            <p className="font-semibold">{fu.title}</p>
                            <p className="text-muted-foreground text-xs">
                              {fu.mission.title}
                              {fu.mission.company && ` - ${fu.mission.company}`}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-border mt-6 flex flex-wrap gap-3 border-t pt-4">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2 text-sm">
            <div className={cn("size-3 rounded-full", color)} />
            <span className="text-muted-foreground">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
