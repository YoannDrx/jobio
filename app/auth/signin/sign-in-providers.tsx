"use client";

import { Divider } from "@/components/nowts/divider";
import { Typography } from "@/components/nowts/typography";
import { sanitizeCallbackUrl } from "@/lib/auth/auth-utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProviderButton } from "./provider-button";
import { SignInCredentialsAndMagicLinkForm } from "./sign-in-credentials-and-magic-link-form";

export const SignInProviders = ({
  providers,
  callbackUrl,
}: {
  providers: string[];
  callbackUrl?: string;
}) => {
  const searchParams = useSearchParams();
  const callbackUrlParams = searchParams.get("callbackUrl");
  const safeCallbackUrl = sanitizeCallbackUrl(
    callbackUrl ?? callbackUrlParams,
    "/job",
  );

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <SignInCredentialsAndMagicLinkForm callbackUrl={safeCallbackUrl} />
      {providers.length > 0 && <Divider>or</Divider>}

      <div
        className={cn(
          "grid grid-cols-1 gap-2 lg:gap-4",
          providers.length > 1 && "lg:grid-cols-2",
        )}
      >
        {/* ℹ️ Add provider you want to support here */}
        {providers.includes("github") && (
          <ProviderButton providerId="github" callbackUrl={safeCallbackUrl} />
        )}
        {providers.includes("google") && (
          <ProviderButton providerId="google" callbackUrl={safeCallbackUrl} />
        )}
      </div>

      <Typography variant="muted" className="text-xs">
        You don't have an account?{" "}
        <Typography
          variant="link"
          as={Link}
          href={`/auth/signup?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`}
        >
          Sign up
        </Typography>
      </Typography>
    </div>
  );
};
