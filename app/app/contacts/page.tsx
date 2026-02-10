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
import { Download, Users, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  email: string | null;
  role: string | null;
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
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [contactLimits, setContactLimits] = useState<{
    used: number;
    limit: number;
    remaining: number;
  } | null>(null);

  // Dialog create/edit
  const [showForm, setShowForm] = useState(false);
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
  }, [page, pageSize, search]);

  useEffect(() => {
    void fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    void resolveActionResult(checkAllLimitsAction()).then((limits) => {
      setContactLimits(limits.contacts);
    });
  }, []);

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setPage(1);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      void fetchContacts();
    }, 300);

    setSearchTimeout(timeout);
  };

  const forceCreateContact = async (data: CreateContactInput) => {
    try {
      await resolveActionResult(createContactAction(data));
      toast.success("Contact cree avec succes");
      setShowForm(false);
      setDuplicateWarning(null);
      setPage(1);
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
      <LayoutActions>
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
          <div className="text-muted-foreground py-12 text-center text-sm">
            Chargement...
          </div>
        ) : contacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun contact"
            description="Créez votre premier contact pour commencer à gérer vos relations."
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
            onPageChange={setPage}
            onContactClick={handleContactClick}
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

      {/* Duplicate warning dialog */}
      <AlertDialog
        open={duplicateWarning !== null}
        onOpenChange={(open) => {
          if (!open) setDuplicateWarning(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Doublon detecte</AlertDialogTitle>
            <AlertDialogDescription>
              {duplicateWarning?.reason === "email" ? (
                <>
                  Un contact avec l&apos;email{" "}
                  <strong>{duplicateWarning.existingContact.email}</strong>{" "}
                  existe deja : {duplicateWarning.existingContact.firstName}{" "}
                  {duplicateWarning.existingContact.lastName}
                  {duplicateWarning.existingContact.company &&
                    ` (${duplicateWarning.existingContact.company})`}
                  .
                </>
              ) : duplicateWarning?.reason === "name_company" ? (
                <>
                  Un contact nomme{" "}
                  <strong>
                    {duplicateWarning.existingContact.firstName}{" "}
                    {duplicateWarning.existingContact.lastName}
                  </strong>{" "}
                  chez{" "}
                  <strong>{duplicateWarning.existingContact.company}</strong>{" "}
                  existe deja.
                </>
              ) : null}
              <br />
              Voulez-vous creer le contact quand meme ?
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
              Creer quand meme
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
