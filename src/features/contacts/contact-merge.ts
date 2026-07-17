import type { MergeContactFieldChoices } from "./contacts.schema";
import { z } from "zod";

export type MergeableContact = {
  firstName: string;
  lastName: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  notes?: string | null;
  linkedinUrl?: string | null;
  tags: string[];
};

const MERGEABLE_FIELDS = [
  "firstName",
  "lastName",
  "company",
  "email",
  "phone",
  "role",
  "notes",
  "linkedinUrl",
] as const;

export const contactMergeSnapshotSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  company: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  role: z.string().nullable(),
  notes: z.string().nullable(),
  linkedinUrl: z.string().nullable(),
  tags: z.array(z.string()),
});

export const createContactMergeSnapshot = (contact: MergeableContact) =>
  contactMergeSnapshotSchema.parse({
    firstName: contact.firstName,
    lastName: contact.lastName,
    company: contact.company ?? null,
    email: contact.email ?? null,
    phone: contact.phone ?? null,
    role: contact.role ?? null,
    notes: contact.notes ?? null,
    linkedinUrl: contact.linkedinUrl ?? null,
    tags: contact.tags,
  });

export function buildMergedContactData(
  target: MergeableContact,
  source: MergeableContact,
  choices: MergeContactFieldChoices,
) {
  const fields = Object.fromEntries(
    MERGEABLE_FIELDS.map((field) => {
      const selected = choices[field] === "source" ? source : target;
      const value = selected[field];

      return [field, value === "" ? null : value];
    }),
  ) as Omit<MergeableContact, "tags">;

  return {
    ...fields,
    tags: Array.from(new Set([...target.tags, ...source.tags])),
  };
}
