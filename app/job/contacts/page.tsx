"use client";

import { Button } from "@/components/ui/button";
import {
  EditSideSheet,
  EditSideSheetBody,
  EditSideSheetContent,
  EditSideSheetHeader,
} from "@/components/nowts/edit-side-sheet";
import { EmptyState } from "@/components/nowts/empty-state";
import { PlanLimitBanner } from "@/components/nowts/plan-limit-banner";
import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { checkAllLimitsAction } from "@/features/plans/check-limits.action";
import {
  checkDuplicateContactAction,
  createContactAction,
  getContactAction,
  getContactsAction,
  getTagsAction,
  updateContactAction,
} from "@/features/contacts/contacts.action";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ContactForm } from "@/features/contacts/components/contact-form";
import { ContactList } from "@/features/contacts/components/contact-list";
import { ContactDetailSheet } from "@/features/contacts/components/contact-detail-sheet";
import { exportContactsAction } from "@/features/contacts/export-contacts.action";
import { computeContactRelationship } from "@/features/contacts/contact-relationship";
import type { CreateContactInput } from "@/features/contacts/contacts.schema";
import { downloadCsv, generateCsv } from "@/lib/csv-export";
import dynamic from "next/dynamic";

const ImportContactsDialog = dynamic(
  async () =>
    import("@/features/contacts/components/import-contacts-dialog").then(
      (m) => m.ImportContactsDialog,
    ),
  { ssr: false },
);
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Upload, Users, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  useQueryState,
  parseAsString,
  parseAsInteger,
  parseAsStringLiteral,
} from "nuqs";
import { toast } from "sonner";

type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  email: string | null;
  role: string | null;
  tags: string[];
  createdAt: Date;
  lastInteractionAt: Date | null;
  relationshipScore: number;
  relationshipTier: "hot" | "warm" | "cold";
  relationshipNextAction: string;
  _count: {
    missions: number;
    interactions: number;
  };
};

type ContactSortBy =
  | "createdAt"
  | "firstName"
  | "lastName"
  | "relationshipScore";
type ContactRelationshipTier = "" | "hot" | "warm" | "cold";

type ContactDetail = {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  role: string | null;
  notes: string | null;
  tags: string[];
  createdAt: Date;
  missions: {
    id: string;
    title: string;
    company: string | null;
    status: string;
  }[];
  interactions: {
    id: string;
    type: string;
    description: string;
    date: Date;
  }[];
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [pageSize] = useState(20);
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [sortBy, setSortBy] = useQueryState(
    "sort",
    parseAsStringLiteral([
      "createdAt",
      "firstName",
      "lastName",
      "relationshipScore",
    ] as const).withDefault("createdAt"),
  );
  const [sortOrder, setSortOrder] = useQueryState(
    "order",
    parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc"),
  );
  const [relationshipTierFilter, setRelationshipTierFilter] = useQueryState(
    "tier",
    parseAsString.withDefault(""),
  );
  const [contactIdParam, setContactIdParam] = useQueryState(
    "contactId",
    parseAsString,
  );
  const [tagFilter, setTagFilter] = useQueryState(
    "tag",
    parseAsString.withDefault(""),
  );
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [contactLimits, setContactLimits] = useState<{
    used: number;
    limit: number;
    remaining: number;
  } | null>(null);

  // Dialog create/edit
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);

  // Duplicate detection
  const [duplicateWarning, setDuplicateWarning] = useState<{
    existingContact: {
      id: string;
      firstName: string;
      lastName: string;
      company: string | null;
      email: string | null;
    };
    reason: "email" | "name_company";
    pendingData: CreateContactInput;
  } | null>(null);

  // Sheet detail
  const [detailContact, setDetailContact] = useState<ContactDetail | null>(
    null,
  );
  const [showDetail, setShowDetail] = useState(false);

  const fetchContacts = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await resolveActionResult(
        getContactsAction({
          search,
          tag: tagFilter || undefined,
          relationshipTier:
            relationshipTierFilter.length > 0
              ? (relationshipTierFilter as Exclude<ContactRelationshipTier, "">)
              : undefined,
          page,
          pageSize,
          sortBy,
          sortOrder,
        }),
      );
      setContacts(result.contacts);
      setTotal(result.total);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors du chargement",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    page,
    pageSize,
    relationshipTierFilter,
    search,
    sortBy,
    sortOrder,
    tagFilter,
  ]);

  useEffect(() => {
    void fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    void resolveActionResult(checkAllLimitsAction()).then((limits) => {
      setContactLimits(limits.contacts);
    });
    void resolveActionResult(getTagsAction()).then((tags) => {
      setAvailableTags(tags);
    });
  }, []);

  const openContactDetail = useCallback(async (contactId: string) => {
    try {
      const result = await resolveActionResult(
        getContactAction({ id: contactId }),
      );
      setDetailContact(result);
      setShowDetail(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors du chargement",
      );
    }
  }, []);

  useEffect(() => {
    if (!contactIdParam) return;
    void openContactDetail(contactIdParam);
  }, [contactIdParam, openContactDetail]);

  const handleSearchChange = (newSearch: string) => {
    void setSearch(newSearch);
    void setPage(1);
  };

  const forceCreateContact = async (data: CreateContactInput) => {
    try {
      await resolveActionResult(createContactAction(data));
      toast.success("Contact créé avec succès");
      setShowForm(false);
      setDuplicateWarning(null);
      void setPage(1);
      void fetchContacts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const handleCreate = async (data: CreateContactInput) => {
    try {
      const check = await resolveActionResult(
        checkDuplicateContactAction(data),
      );
      if (check.duplicate) {
        setDuplicateWarning({
          existingContact: check.existingContact,
          reason: check.reason,
          pendingData: data,
        });
        return;
      }
      await forceCreateContact(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const handleUpdate = async (data: CreateContactInput) => {
    if (!editing) return;
    try {
      await resolveActionResult(
        updateContactAction({
          id: editing.id,
          ...data,
        }),
      );
      toast.success("Contact mis à jour");
      setShowForm(false);
      setEditing(null);
      void fetchContacts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const handleContactClick = (contactId: string) => {
    void setContactIdParam(contactId);
  };

  const handleEdit = (contact: ContactDetail) => {
    const lastInteractionAt = contact.interactions.at(0)?.date ?? null;
    const relationship = computeContactRelationship({
      missionCount: contact.missions.length,
      interactionCount: contact.interactions.length,
      lastInteractionAt,
    });
    const contactForEdit: Contact = {
      ...contact,
      lastInteractionAt,
      relationshipScore: relationship.score,
      relationshipTier: relationship.tier,
      relationshipNextAction: relationship.nextAction,
      _count: {
        missions: contact.missions.length,
        interactions: contact.interactions.length,
      },
    };
    setEditing(contactForEdit);
    setShowForm(true);
    setShowDetail(false);
    void setContactIdParam(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleRefreshDetail = async () => {
    if (detailContact) {
      await openContactDetail(detailContact.id);
      void fetchContacts();
    }
  };

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>
          Contacts{" "}
          {total > 0 && (
            <span className="text-muted-foreground">({total})</span>
          )}
        </LayoutTitle>
      </LayoutHeader>
      <LayoutActions className="gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            try {
              const rows = await resolveActionResult(exportContactsAction());
              const csv = generateCsv(rows, [
                { key: "firstName", header: "Prénom" },
                { key: "lastName", header: "Nom" },
                { key: "company", header: "Entreprise" },
                { key: "email", header: "Email" },
                { key: "phone", header: "Téléphone" },
                { key: "role", header: "Rôle" },
                { key: "linkedinUrl", header: "LinkedIn" },
                { key: "missions", header: "Missions" },
                { key: "interactions", header: "Interactions" },
                { key: "createdAt", header: "Date de création" },
              ]);
              downloadCsv(
                csv,
                `contacts-${new Date().toISOString().split("T")[0]}.csv`,
              );
              toast.success("Export CSV téléchargé");
            } catch {
              toast.error("Erreur lors de l'export");
            }
          }}
        >
          <Download className="size-4" />
          Exporter CSV
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>
          <Upload className="size-4" />
          Importer CSV
        </Button>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          <Plus className="size-4" />
          Nouveau contact
        </Button>
      </LayoutActions>

      <LayoutContent className="flex flex-col gap-4">
        {contactLimits && (
          <PlanLimitBanner
            used={contactLimits.used}
            limit={contactLimits.limit}
            remaining={contactLimits.remaining}
            featureLabel="contacts"
          />
        )}

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun contact"
            description="Crée ton premier contact pour commencer à gérer tes relations."
            action={{
              label: "Créer un contact",
              onClick: () => setShowForm(true),
            }}
          />
        ) : (
          <ContactList
            contacts={contacts}
            total={total}
            page={page}
            pageSize={pageSize}
            search={search}
            onSearchChange={handleSearchChange}
            onPageChange={(p) => void setPage(p)}
            onContactClick={handleContactClick}
            tagFilter={tagFilter}
            onTagFilterChange={(tag) => {
              void setTagFilter(tag);
              void setPage(1);
            }}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(nextSortBy, nextSortOrder) => {
              void setSortBy(nextSortBy as ContactSortBy);
              void setSortOrder(nextSortOrder);
              void setPage(1);
            }}
            relationshipTierFilter={
              relationshipTierFilter as ContactRelationshipTier
            }
            onRelationshipTierChange={(nextTier) => {
              void setRelationshipTierFilter(nextTier);
              void setPage(1);
            }}
            availableTags={availableTags}
            onDataChanged={() => {
              void fetchContacts();
            }}
          />
        )}
      </LayoutContent>

      {/* Create/Edit side sheet */}
      <EditSideSheet open={showForm} onOpenChange={handleCloseForm}>
        <EditSideSheetContent>
          <EditSideSheetHeader
            title={editing ? "Modifier le contact" : "Nouveau contact"}
          />
          <EditSideSheetBody>
            <ContactForm
              key={editing?.id ?? "new"}
              defaultValues={
                editing
                  ? {
                      firstName: editing.firstName,
                      lastName: editing.lastName,
                      company: editing.company ?? "",
                      email: editing.email ?? "",
                      role: editing.role ?? "",
                      tags: editing.tags,
                    }
                  : undefined
              }
              onSubmit={editing ? handleUpdate : handleCreate}
              onCancel={handleCloseForm}
              submitLabel={editing ? "Modifier" : "Créer le contact"}
            />
          </EditSideSheetBody>
        </EditSideSheetContent>
      </EditSideSheet>

      {/* Detail sheet */}
      <ContactDetailSheet
        contact={detailContact}
        open={showDetail}
        onOpenChange={(open) => {
          setShowDetail(open);
          if (!open) {
            setDetailContact(null);
            void setContactIdParam(null);
          }
        }}
        onEdit={handleEdit}
        onRefresh={handleRefreshDetail}
      />

      {/* Import CSV dialog */}
      <ImportContactsDialog
        open={showImport}
        onOpenChange={setShowImport}
        onSuccess={() => void fetchContacts()}
      />

      {/* Duplicate warning dialog */}
      <AlertDialog
        open={duplicateWarning !== null}
        onOpenChange={(open) => {
          if (!open) setDuplicateWarning(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Doublon détecté</AlertDialogTitle>
            <AlertDialogDescription>
              {duplicateWarning?.reason === "email" ? (
                <>
                  Un contact avec l&apos;email{" "}
                  <strong>{duplicateWarning.existingContact.email}</strong>{" "}
                  existe déjà : {duplicateWarning.existingContact.firstName}{" "}
                  {duplicateWarning.existingContact.lastName}
                  {duplicateWarning.existingContact.company &&
                    ` (${duplicateWarning.existingContact.company})`}
                  .
                </>
              ) : duplicateWarning?.reason === "name_company" ? (
                <>
                  Un contact nommé{" "}
                  <strong>
                    {duplicateWarning.existingContact.firstName}{" "}
                    {duplicateWarning.existingContact.lastName}
                  </strong>{" "}
                  chez{" "}
                  <strong>{duplicateWarning.existingContact.company}</strong>{" "}
                  existe déjà.
                </>
              ) : null}
              <br />
              Veux-tu créer le contact quand même ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (duplicateWarning) {
                  void forceCreateContact(duplicateWarning.pendingData);
                }
              }}
            >
              Créer quand même
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
