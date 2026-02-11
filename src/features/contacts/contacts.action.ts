"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { enforcePlanLimit } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  addInteractionSchema,
  contactFilterSchema,
  createContactSchema,
  updateContactSchema,
} from "./contacts.schema";
import { checkDuplicateContact } from "./duplicate-detection";

export const checkDuplicateContactAction = authAction
  .inputSchema(createContactSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    return checkDuplicateContact({
      userId: user.id,
      firstName: parsedInput.firstName,
      lastName: parsedInput.lastName,
      company: parsedInput.company,
      email: parsedInput.email,
    });
  });

export const createContactAction = authAction
  .inputSchema(createContactSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    await enforcePlanLimit(user.id, "contacts");

    const contact = await prisma.contact.create({
      data: {
        ...parsedInput,
        userId: user.id,
        email: parsedInput.email ?? null,
        linkedinUrl: parsedInput.linkedinUrl ?? null,
      },
    });

    return contact;
  });

export const updateContactAction = authAction
  .inputSchema(updateContactSchema)
  .action(async ({ parsedInput: { id, ...data }, ctx: { user } }) => {
    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });

    if (!contact) {
      throw new ApplicationError("Contact introuvable");
    }

    const updated = await prisma.contact.update({
      where: { id },
      data: {
        ...data,
        email: data.email === "" ? null : data.email,
        linkedinUrl: data.linkedinUrl === "" ? null : data.linkedinUrl,
      },
    });

    return updated;
  });

export const deleteContactAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });

    if (!contact) {
      throw new ApplicationError("Contact introuvable");
    }

    return prisma.contact.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  });

export const getContactsAction = authAction
  .inputSchema(contactFilterSchema)
  .action(async ({ parsedInput: filters, ctx: { user } }) => {
    const where: Record<string, unknown> = {
      userId: user.id,
      deletedAt: null,
    };

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { company: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters.tag) {
      where.tags = { has: filters.tag };
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: true,
          email: true,
          role: true,
          tags: true,
          createdAt: true,
          _count: { select: { missions: true, interactions: true } },
        },
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      prisma.contact.count({ where }),
    ]);

    return {
      contacts,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(total / filters.pageSize),
    };
  });

export const getContactAction = authAction
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id }, ctx: { user } }) => {
    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id, deletedAt: null },
      include: {
        missions: {
          select: {
            id: true,
            title: true,
            company: true,
            status: true,
          },
        },
        interactions: {
          orderBy: { date: "desc" },
          take: 20,
        },
      },
    });

    if (!contact) {
      throw new ApplicationError("Contact introuvable");
    }

    return contact;
  });

export const linkContactToMissionAction = authAction
  .inputSchema(
    z.object({
      contactId: z.string(),
      missionId: z.string(),
    }),
  )
  .action(async ({ parsedInput: { contactId, missionId }, ctx: { user } }) => {
    const [contact, mission] = await Promise.all([
      prisma.contact.findFirst({
        where: { id: contactId, userId: user.id, deletedAt: null },
      }),
      prisma.mission.findFirst({
        where: { id: missionId, userId: user.id, deletedAt: null },
      }),
    ]);

    if (!contact) {
      throw new ApplicationError("Contact introuvable");
    }

    if (!mission) {
      throw new ApplicationError("Mission introuvable");
    }

    return prisma.mission.update({
      where: { id: missionId },
      data: { contactId },
    });
  });

export const addInteractionAction = authAction
  .inputSchema(addInteractionSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const contact = await prisma.contact.findFirst({
      where: { id: parsedInput.contactId, userId: user.id, deletedAt: null },
    });

    if (!contact) {
      throw new ApplicationError("Contact introuvable");
    }

    return prisma.contactInteraction.create({
      data: {
        contactId: parsedInput.contactId,
        type: parsedInput.type,
        description: parsedInput.description,
        date: parsedInput.date,
      },
    });
  });

export const addTagAction = authAction
  .inputSchema(z.object({ id: z.string(), tag: z.string().min(1) }))
  .action(async ({ parsedInput: { id, tag }, ctx: { user } }) => {
    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });

    if (!contact) {
      throw new ApplicationError("Contact introuvable");
    }

    const updatedTags = Array.from(new Set([...contact.tags, tag]));

    return prisma.contact.update({
      where: { id },
      data: { tags: updatedTags },
    });
  });

export const removeTagAction = authAction
  .inputSchema(z.object({ id: z.string(), tag: z.string() }))
  .action(async ({ parsedInput: { id, tag }, ctx: { user } }) => {
    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id, deletedAt: null },
    });

    if (!contact) {
      throw new ApplicationError("Contact introuvable");
    }

    const updatedTags = contact.tags.filter((t) => t !== tag);

    return prisma.contact.update({
      where: { id },
      data: { tags: updatedTags },
    });
  });

export const getTagsAction = authAction.action(async ({ ctx: { user } }) => {
  const contacts = await prisma.contact.findMany({
    where: { userId: user.id, deletedAt: null },
    select: { tags: true },
  });

  const allTags = new Set<string>();
  contacts.forEach((contact) => {
    contact.tags.forEach((tag) => allTags.add(tag));
  });

  return Array.from(allTags).sort();
});

export const bulkDeleteContactsAction = authAction
  .inputSchema(z.object({ ids: z.array(z.string()).min(1) }))
  .action(async ({ parsedInput: { ids }, ctx: { user } }) => {
    const result = await prisma.contact.updateMany({
      where: { id: { in: ids }, userId: user.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return { deleted: result.count };
  });

export const bulkAddTagAction = authAction
  .inputSchema(
    z.object({ ids: z.array(z.string()).min(1), tag: z.string().min(1) }),
  )
  .action(async ({ parsedInput: { ids, tag }, ctx: { user } }) => {
    const contacts = await prisma.contact.findMany({
      where: { id: { in: ids }, userId: user.id, deletedAt: null },
      select: { id: true, tags: true },
    });
    const toUpdate = contacts.filter((c) => !c.tags.includes(tag));
    await Promise.all(
      toUpdate.map(async (contact) =>
        prisma.contact.update({
          where: { id: contact.id },
          data: { tags: [...contact.tags, tag] },
        }),
      ),
    );
    return { updated: toUpdate.length };
  });

export const bulkRemoveTagAction = authAction
  .inputSchema(
    z.object({ ids: z.array(z.string()).min(1), tag: z.string().min(1) }),
  )
  .action(async ({ parsedInput: { ids, tag }, ctx: { user } }) => {
    const contacts = await prisma.contact.findMany({
      where: { id: { in: ids }, userId: user.id, deletedAt: null },
      select: { id: true, tags: true },
    });
    const toUpdate = contacts.filter((c) => c.tags.includes(tag));
    await Promise.all(
      toUpdate.map(async (contact) =>
        prisma.contact.update({
          where: { id: contact.id },
          data: { tags: contact.tags.filter((t) => t !== tag) },
        }),
      ),
    );
    return { updated: toUpdate.length };
  });

export const mergeContactsAction = authAction
  .inputSchema(
    z.object({
      targetId: z.string(),
      sourceId: z.string(),
      fields: z.record(z.string(), z.enum(["target", "source"])),
    }),
  )
  .action(
    async ({ parsedInput: { targetId, sourceId, fields }, ctx: { user } }) => {
      const [targetContact, sourceContact] = await Promise.all([
        prisma.contact.findFirst({
          where: { id: targetId, userId: user.id, deletedAt: null },
        }),
        prisma.contact.findFirst({
          where: { id: sourceId, userId: user.id, deletedAt: null },
        }),
      ]);

      if (!targetContact || !sourceContact) {
        throw new ApplicationError("Un des contacts est introuvable");
      }

      const updateData: Record<string, unknown> = {};
      const fieldMap = {
        firstName: "firstName",
        lastName: "lastName",
        company: "company",
        email: "email",
        phone: "phone",
        role: "role",
        notes: "notes",
        linkedinUrl: "linkedinUrl",
      };

      Object.entries(fieldMap).forEach(([key, dbField]) => {
        const fieldChoice = fields[key] as "target" | "source" | undefined;
        if (fieldChoice === "source") {
          updateData[dbField] =
            sourceContact[key as keyof typeof sourceContact];
        } else {
          updateData[dbField] =
            targetContact[key as keyof typeof targetContact];
        }
      });

      return prisma.$transaction(async (tx) => {
        await tx.contact.update({
          where: { id: targetId },
          data: updateData,
        });

        await tx.mission.updateMany({
          where: { contactId: sourceId },
          data: { contactId: targetId },
        });

        await tx.contact.update({
          where: { id: sourceId },
          data: { deletedAt: new Date() },
        });

        return tx.contact.findFirst({
          where: { id: targetId, userId: user.id, deletedAt: null },
        });
      });
    },
  );
