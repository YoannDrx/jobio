"use client";

import { getCurrentPlanAction } from "@/features/plans/check-limits.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { useSession } from "@/lib/auth-client";
import { useEffect, useState } from "react";

type PlanName = "free" | "pro";

export const useCurrentUser = () => {
  const { data, isPending } = useSession();
  const user = data?.user;
  const userId = user?.id;
  const [plan, setPlan] = useState<PlanName>("free");
  const [isPlanLoading, setIsPlanLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setPlan("free");
      return;
    }

    let isActive = true;
    setIsPlanLoading(true);

    void resolveActionResult(getCurrentPlanAction())
      .then((result) => {
        if (!isActive) return;
        if (result.plan === "free" || result.plan === "pro") {
          setPlan(result.plan);
          return;
        }
        setPlan("free");
      })
      .catch(() => {
        if (!isActive) return;
        setPlan("free");
      })
      .finally(() => {
        if (!isActive) return;
        setIsPlanLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [userId]);

  if (!user) {
    return {
      user: null,
      isLoading: isPending,
    };
  }

  return {
    user: {
      ...user,
      subscription: {
        plan,
      },
    },
    isLoading: isPending || isPlanLoading,
  };
};
