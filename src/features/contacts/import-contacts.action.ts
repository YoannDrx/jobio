"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { checkPlanLimit } from "@/lib/plan-limits";
import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const importContactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export const importContactsAction = authAction
  .inputSchema(
    z.object({
      contacts: z.array(importContactSchema),
      skipDuplicates: z.boolean().default(true),
    }),
  )
  .action(
    async ({ parsedInput: { contacts, skipDuplicates }, ctx: { user } }) => {
      const limitCheck = await checkPlanLimit(user.id, "contacts");
      if (limitCheck.remaining < contacts.length) {
        throw new ApplicationError(
          `Limite de contacts atteinte : ${limitCheck.remaining} places restantes sur ${limitCheck.limit}. Tu essaies d'importer ${contacts.length} contacts.`,
        );
      }

      const results = {
        created: 0,
        skipped: 0,
        errors: [] as { line: number; error: string }[],
      };

      let existingEmails = new Set<string>();
      if (skipDuplicates) {
        const emails = contacts
          .map((c) => c.email)
          .filter((e): e is string => Boolean(e));
        if (emails.length > 0) {
          const existing = await prisma.contact.findMany({
            where: {
              userId: user.id,
              email: { in: emails },
              deletedAt: null,
            },
            select: { email: true },
          });
          existingEmails = new Set(
            existing.map((e) => e.email).filter(Boolean) as string[],
          );
        }
      }

      const toCreate: {
        index: number;
        data: {
          firstName: string;
          lastName: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          role: string | null;
          linkedinUrl: string | null;
          tags: string[];
          userId: string;
        };
      }[] = [];

      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        if (
          skipDuplicates &&
          contact.email &&
          existingEmails.has(contact.email)
        ) {
          results.skipped++;
          continue;
        }
        toCreate.push({
          index: i,
          data: {
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email ?? null,
            phone: contact.phone ?? null,
            company: contact.company ?? null,
            role: contact.role ?? null,
            linkedinUrl: contact.linkedinUrl ?? null,
            tags: contact.tags ?? [],
            userId: user.id,
          },
        });
      }

      const settledResults = await Promise.allSettled(
        toCreate.map(async (item) =>
          prisma.contact.create({ data: item.data }),
        ),
      );

      settledResults.forEach((result, idx) => {
        if (result.status === "fulfilled") {
          results.created++;
        } else {
          results.errors.push({
            line: toCreate[idx].index + 1,
            error:
              result.reason instanceof Error
                ? result.reason.message
                : "Erreur inconnue",
          });
        }
      });

      return results;
    },
  );
