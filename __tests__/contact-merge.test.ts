import { describe, expect, it } from "vitest";

import {
  buildMergedContactData,
  contactMergeSnapshotSchema,
  createContactMergeSnapshot,
} from "@/features/contacts/contact-merge";
import type { MergeContactFieldChoices } from "@/features/contacts/contacts.schema";

const choices: MergeContactFieldChoices = {
  firstName: "target",
  lastName: "target",
  company: "source",
  email: "source",
  phone: "target",
  role: "target",
  notes: "source",
  linkedinUrl: "target",
};

describe("contact merge", () => {
  it("keeps the selected values and merges tags without duplicates", () => {
    expect(
      buildMergedContactData(
        {
          firstName: "Ada",
          lastName: "Lovelace",
          company: "Analytical",
          email: "ada@old.example",
          phone: "+33123456789",
          role: "CTO",
          notes: "Premier échange",
          linkedinUrl: null,
          tags: ["recruteur", "prioritaire"],
        },
        {
          firstName: "Augusta",
          lastName: "Lovelace",
          company: "Babbage & Co",
          email: "ada@new.example",
          phone: null,
          role: "Founder",
          notes: "Nouvelles informations",
          linkedinUrl: "https://linkedin.com/in/ada",
          tags: ["prioritaire", "client"],
        },
        choices,
      ),
    ).toEqual({
      firstName: "Ada",
      lastName: "Lovelace",
      company: "Babbage & Co",
      email: "ada@new.example",
      phone: "+33123456789",
      role: "CTO",
      notes: "Nouvelles informations",
      linkedinUrl: null,
      tags: ["recruteur", "prioritaire", "client"],
    });
  });

  it("normalizes selected empty optional fields to null", () => {
    const result = buildMergedContactData(
      {
        firstName: "Ada",
        lastName: "Lovelace",
        company: "Analytical",
        tags: [],
      },
      {
        firstName: "Ada",
        lastName: "Lovelace",
        company: "",
        email: "",
        tags: [],
      },
      choices,
    );

    expect(result.company).toBeNull();
    expect(result.email).toBeNull();
  });

  it("creates a strict reversible snapshot without relational data", () => {
    const snapshot = createContactMergeSnapshot({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      tags: ["recruteur"],
    });

    expect(contactMergeSnapshotSchema.parse(snapshot)).toEqual({
      firstName: "Ada",
      lastName: "Lovelace",
      company: null,
      email: "ada@example.com",
      phone: null,
      role: null,
      notes: null,
      linkedinUrl: null,
      tags: ["recruteur"],
    });
  });
});
