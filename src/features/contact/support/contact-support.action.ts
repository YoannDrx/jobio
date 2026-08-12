"use server";

import { rateLimitedPublicAction } from "@/lib/actions/safe-actions";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/mail/send-email";
import { ContactSupportSchema } from "./contact-support.schema";

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );

export const contactSupportAction = rateLimitedPublicAction(
  "contact-support",
  3,
  600,
)
  .inputSchema(ContactSupportSchema)
  .action(async ({ parsedInput: { email, subject, message } }) => {
    await sendEmail({
      to: env.NEXT_PUBLIC_EMAIL_CONTACT,
      subject: `Demande de support Jobio — ${subject}`,
      text: message,
      html: `<p>${escapeHtml(message).replaceAll("\n", "<br>")}</p>`,
      replyTo: email,
    });
    return { message: "Ton message a bien été envoyé au support." };
  });
