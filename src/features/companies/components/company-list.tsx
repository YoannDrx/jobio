"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/nowts/empty-state";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  createCompanyAction,
  deleteCompanyAction,
  getCompaniesAction,
  updateCompanyAction,
} from "@/features/companies/companies.action";
import { getContactsAction } from "@/features/contacts/contacts.action";
import { CompanyForm } from "./company-form";
import type { CreateCompanyInput } from "@/features/companies/companies.schema";
import {
  Building2,
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Company = {
  id: string;
  name: string;
  website: string | null;
  notes: string | null;
  sector: string | null;
  size: "STARTUP" | "PME" | "ETI" | "GRAND_GROUPE" | null;
  status: "A_DEMARCHER" | "CONTACTE" | "EN_DISCUSSION" | "REFUSE";
  contactId: string | null;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    company: string | null;
  } | null;
};

type ContactOption = {
  id: string;
  firstName: string;
  lastName: string;
};

const STATUS_CONFIG = {
  A_DEMARCHER: {
    label: "A démarcher",
    className:
      "bg-status-neutral/15 text-status-neutral border-status-neutral/30",
  },
  CONTACTE: {
    label: "Contacté",
    className:
      "bg-status-warning/15 text-status-warning border-status-warning/30",
  },
  EN_DISCUSSION: {
    label: "En discussion",
    className: "bg-status-info/15 text-status-info border-status-info/30",
  },
  REFUSE: {
    label: "Refusé",
    className: "bg-status-error/15 text-status-error border-status-error/30",
  },
} as const;

const SIZE_LABELS = {
  STARTUP: "Startup",
  PME: "PME",
  ETI: "ETI",
  GRAND_GROUPE: "Grand groupe",
} as const;

const STATUS_CYCLE: Company["status"][] = [
  "A_DEMARCHER",
  "CONTACTE",
  "EN_DISCUSSION",
  "REFUSE",
];

export function CompanyList() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [companiesResult, contactsResult] = await Promise.all([
        resolveActionResult(getCompaniesAction()),
        resolveActionResult(getContactsAction({})),
      ]);
      setCompanies(companiesResult);
      setContacts(
        contactsResult.contacts.map((c) => ({
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
        })),
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors du chargement",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleCreate = async (data: CreateCompanyInput) => {
    await resolveActionResult(createCompanyAction(data));
    toast.success("Entreprise créée");
    setDialogOpen(false);
    void fetchData();
  };

  const handleUpdate = async (data: CreateCompanyInput) => {
    if (!editingCompany) return;
    await resolveActionResult(
      updateCompanyAction({ id: editingCompany.id, ...data }),
    );
    toast.success("Entreprise mise à jour");
    setEditingCompany(null);
    setDialogOpen(false);
    void fetchData();
  };

  const handleDelete = async (id: string) => {
    try {
      await resolveActionResult(deleteCompanyAction({ id }));
      toast.success("Entreprise supprimée");
      void fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la suppression",
      );
    }
  };

  const cycleStatus = async (company: Company) => {
    const currentIndex = STATUS_CYCLE.indexOf(company.status);
    const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];
    try {
      await resolveActionResult(
        updateCompanyAction({ id: company.id, status: nextStatus }),
      );
      toast.success("Statut mis à jour");
      void fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la mise à jour",
      );
    }
  };

  const openEdit = (company: Company) => {
    setEditingCompany(company);
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingCompany(null);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="text-muted-foreground py-12 text-center text-sm">
        Chargement...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-1 size-4" />
          Ajouter une entreprise
        </Button>
      </div>

      {companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Aucune entreprise ajoutée"
          description="Ajoutez les entreprises que vous démarchez directement."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id} className="gap-3 py-4">
              <CardHeader className="pb-0">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="flex items-center gap-2">
                      {company.name}
                      {company.website && (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {company.sector && (
                        <Badge variant="secondary" className="text-xs">
                          {company.sector}
                        </Badge>
                      )}
                      {company.size && (
                        <Badge variant="secondary" className="text-xs">
                          {SIZE_LABELS[company.size]}
                        </Badge>
                      )}
                      <button
                        onClick={() => void cycleStatus(company)}
                        className="cursor-pointer"
                      >
                        <Badge
                          variant="outline"
                          className={STATUS_CONFIG[company.status].className}
                        >
                          {STATUS_CONFIG[company.status].label}
                        </Badge>
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={() => openEdit(company)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive size-7"
                      onClick={() => void handleDelete(company.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {(company.contact ?? company.notes) && (
                <CardContent className="py-0">
                  <div className="flex flex-col gap-1.5">
                    {company.contact && (
                      <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                        <User className="size-3" />
                        {company.contact.firstName} {company.contact.lastName}
                      </div>
                    )}
                    {company.notes && (
                      <p className="text-muted-foreground line-clamp-2 text-xs">
                        {company.notes}
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingCompany(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCompany
                ? "Modifier l'entreprise"
                : "Ajouter une entreprise"}
            </DialogTitle>
            <DialogDescription>
              {editingCompany
                ? "Modifiez les informations de l'entreprise."
                : "Ajoutez une entreprise que vous démarchez directement."}
            </DialogDescription>
          </DialogHeader>
          <CompanyForm
            defaultValues={
              editingCompany
                ? {
                    name: editingCompany.name,
                    website: editingCompany.website ?? "",
                    notes: editingCompany.notes ?? "",
                    sector: editingCompany.sector ?? "",
                    size: editingCompany.size ?? undefined,
                    status: editingCompany.status,
                    contactId: editingCompany.contactId ?? undefined,
                  }
                : undefined
            }
            contacts={contacts}
            onSubmit={editingCompany ? handleUpdate : handleCreate}
            onCancel={() => {
              setDialogOpen(false);
              setEditingCompany(null);
            }}
            submitLabel={editingCompany ? "Modifier" : "Créer l'entreprise"}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
