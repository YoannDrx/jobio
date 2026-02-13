"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
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
  _count: {
    missions: number;
    interactions: number;
  };
};

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
  const [tagFilter, setTagFilter] = useQueryState(
    "tag",
    parseAsString.withDefault(""),
  );
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
          page,
          pageSize,
          sortBy: "createdAt",
          sortOrder: "desc",
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
  }, [page, pageSize, search, tagFilter]);

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

  const handleSearchChange = (newSearch: string) => {
    void setSearch(newSearch);
    void setPage(1);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      void fetchContacts();
    }, 300);
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

  const handleContactClick = async (contactId: string) => {
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
  };

  const handleEdit = (contact: ContactDetail) => {
    const contactForEdit: Contact = {
      ...contact,
      _count: {
        missions: contact.missions.length,
        interactions: contact.interactions.length,
      },
    };
    setEditing(contactForEdit);
    setShowForm(true);
    setShowDetail(false);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleRefreshDetail = async () => {
    if (detailContact) {
      await handleContactClick(detailContact.id);
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
            availableTags={availableTags}
          />
        )}
      </LayoutContent>

      {/* Create/Edit dialog */}
      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier le contact" : "Nouveau contact"}
            </DialogTitle>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>

      {/* Detail sheet */}
      <ContactDetailSheet
        contact={detailContact}
        open={showDetail}
        onOpenChange={setShowDetail}
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
