"use client";

type ActivityEvent = {
  id: string;
  type: string;
  description: string | null;
  createdAt: Date;
};

type MissionDetailActivityProps = {
  events: ActivityEvent[];
};

export function MissionDetailActivity({ events }: MissionDetailActivityProps) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-sm font-medium">Historique</h4>
      <div className="flex flex-col gap-2">
        {events.map((event) => (
          <div key={event.id} className="flex items-start gap-2 text-sm">
            <span className="text-muted-foreground text-xs whitespace-nowrap">
              {new Date(event.createdAt).toLocaleDateString("fr-FR")}
            </span>
            <span>{event.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
