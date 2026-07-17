import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin, emailOTP, lastLoginMethod } from "better-auth/plugins";

import { sendEmail } from "@/lib/mail/send-email";
import { SiteConfig } from "@/site-config";
import ChangeEmailEmail from "@email/change-email.email";
import DeleteAccountEmail from "@email/delete-account.email";
import OtpSigninEmail from "@email/otp-signin.email";
import ResetPasswordEmail from "@email/reset-password.email";
import VerifyEmailEmail from "@email/verify-email.email";
import WelcomeEmail from "@email/welcome.email";
import { setupResendCustomer } from "./auth/auth-config-setup";
import { env } from "./env";
import { logger } from "./logger";
import { prisma } from "./prisma";
import { getServerUrl } from "./server-url";
type SocialProvidersType = Parameters<typeof betterAuth>[0]["socialProviders"];
const shouldSkipAuthSideEffects = env.CI === true;

const sendAuthEmail = async (payload: Parameters<typeof sendEmail>[0]) => {
  if (shouldSkipAuthSideEffects) {
    logger.debug("Skipping auth email in CI mode", {
      to: payload.to,
      subject: payload.subject,
    });
    return;
  }

  await sendEmail(payload);
};

export const SocialProviders: SocialProvidersType = {};

if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  SocialProviders.github = {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  };
}

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  SocialProviders.google = {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: getServerUrl(),
  session: {
    expiresIn: 60 * 60 * 24 * 20, // 20 days
    updateAge: 60 * 60 * 24 * 7, // Refresh session every 7 days
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes - cache session in signed cookie
    },
  },
  rateLimit: {
    // Disable rate limiting in CI
    enabled: env.CI ? false : undefined,
  },
  trustedOrigins: [
    getServerUrl(),
    ...(env.NODE_ENV === "development" ? ["http://localhost:3000"] : []),
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user, _req) => {
          if (shouldSkipAuthSideEffects) {
            return;
          }

          await setupResendCustomer(user);
          await sendAuthEmail({
            to: user.email,
            subject: `Bienvenue sur ${SiteConfig.title} !`,
            html: WelcomeEmail({ name: user.name || "Freelance" }),
          });
        },
      },
    },
  },
  advanced: {
    cookiePrefix: SiteConfig.appId,
  },
  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url }) {
      await sendAuthEmail({
        to: user.email,
        subject: "Réinitialise ton mot de passe",
        html: ResetPasswordEmail({ url }),
      });
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({
        newEmail,
        url,
      }: {
        newEmail: string;
        url: string;
      }) => {
        await sendAuthEmail({
          to: newEmail,
          subject: "Confirme ton changement d'adresse email",
          html: ChangeEmailEmail({ url }),
        });
      },
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, token }) => {
        const url = `${getServerUrl()}/auth/confirm-delete?token=${token}&callbackUrl=/auth/goodbye`;
        await sendAuthEmail({
          to: user.email,
          subject: "Suppression de ton compte",
          html: DeleteAccountEmail({ url }),
        });
      },
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendAuthEmail({
        to: user.email,
        subject: "Vérifie ton adresse email",
        html: VerifyEmailEmail({ url }),
      });
    },
  },
  socialProviders: SocialProviders,
  plugins: [
    emailOTP({
      sendVerificationOTP: async ({ email, otp }) => {
        logger.debug("Sending OTP", { email, otp });
        await sendAuthEmail({
          to: email,
          subject: `Ton code de connexion à ${SiteConfig.title} ${otp}`,
          html: OtpSigninEmail({
            otp,
            autoLoginUrl: `${getServerUrl()}/auth/signin/otp?email=${email}&otp=${otp}`,
          }),
        });
      },
    }),
    admin({}),
    lastLoginMethod({}),
    // Warning: always last plugin
    nextCookies(),
  ],
});
