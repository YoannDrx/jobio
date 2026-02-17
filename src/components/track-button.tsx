"use client";

import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";
import type { AnalyticsEvent } from "@/lib/analytics";

type TrackButtonProps = ButtonProps & {
  event: AnalyticsEvent | string;
  eventProperties?: Record<string, unknown>;
};

export function TrackButton({
  event,
  eventProperties,
  onClick,
  ...props
}: TrackButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    track(event, eventProperties);
    onClick?.(e);
  };

  return <Button {...props} onClick={handleClick} />;
}
