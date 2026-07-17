import type { MissionStatus } from "@/components/nowts/status-badge";

export const applyOptimisticMissionStatus = <
  T extends { id: string; status: string },
>(
  missions: T[],
  missionId: string,
  status: MissionStatus,
) =>
  missions.map((mission) =>
    mission.id === missionId ? { ...mission, status } : mission,
  );

export const applyOptimisticStatusCounters = (
  counters: Record<string, number>,
  previousStatus: MissionStatus,
  nextStatus: MissionStatus,
) => {
  if (previousStatus === nextStatus) return counters;

  return {
    ...counters,
    [previousStatus]: Math.max(0, (counters[previousStatus] ?? 0) - 1),
    [nextStatus]: (counters[nextStatus] ?? 0) + 1,
  };
};
