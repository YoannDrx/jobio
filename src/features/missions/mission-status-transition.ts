import type { MissionStatusValue } from "./mission-status";

export const resolveMissionStatusTransition = (params: {
  currentStatus: MissionStatusValue;
  nextStatus: MissionStatusValue;
  expectedStatus?: MissionStatusValue;
}) => {
  if (params.currentStatus === params.nextStatus) return "noop" as const;
  if (
    params.expectedStatus !== undefined &&
    params.currentStatus !== params.expectedStatus
  ) {
    return "conflict" as const;
  }
  return "apply" as const;
};
