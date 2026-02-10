import { prisma } from "@/lib/prisma";

type DuplicateCheckInput = {
  userId: string;
  firstName: string;
  lastName: string;
  company?: string;
  email?: string;
};

type DuplicateResult =
  | { duplicate: false }
  | {
      duplicate: true;
      existingContact: {
        id: string;
        firstName: string;
        lastName: string;
        company: string | null;
        email: string | null;
      };
      reason: "email" | "name_company";
    };

export async function checkDuplicateContact(
  input: DuplicateCheckInput,
): Promise<DuplicateResult> {
  // Check exact email match
  if (input.email && input.email !== "") {
    const emailMatch = await prisma.contact.findFirst({
      where: {
        userId: input.userId,
        email: { equals: input.email, mode: "insensitive" },
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        email: true,
      },
    });

    if (emailMatch) {
      return { duplicate: true, existingContact: emailMatch, reason: "email" };
    }
  }

  // Check firstName + lastName + company (case insensitive)
  if (input.company && input.company !== "") {
    const nameCompanyMatch = await prisma.contact.findFirst({
      where: {
        userId: input.userId,
        firstName: { equals: input.firstName, mode: "insensitive" },
        lastName: { equals: input.lastName, mode: "insensitive" },
        company: { equals: input.company, mode: "insensitive" },
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        email: true,
      },
    });

    if (nameCompanyMatch) {
      return {
        duplicate: true,
        existingContact: nameCompanyMatch,
        reason: "name_company",
      };
    }
  }

  return { duplicate: false };
}
