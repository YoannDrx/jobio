"use client";

import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";

export type AuthProvider = "github" | "google";

export const useIsLastUsedProvider = (provider: AuthProvider) => {
  const { data } = useQuery({
    queryFn: async () => {
      return Boolean(await authClient.isLastUsedLoginMethod(provider));
    },
    initialData: false,
    queryKey: ["lastUsedProvider", provider],
    staleTime: Infinity,
  });

  return data;
};
