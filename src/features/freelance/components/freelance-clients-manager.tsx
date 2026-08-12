"use client";

import { Badge } from "@/components/ui/badge";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { BillingClientType } from "@/features/freelance/billing-client-enums";
import { searchBillingCompaniesAction } from "@/features/freelance/billing-company-search.action";
import {
  createBillingClientAction,
  deleteBillingClientAction,
  getBillingClientsAction,
  hardDeleteBillingClientAction,
  updateBillingClientAction,
} from "@/features/freelance/billing-clients.action";
import {
  FreelanceSideSheetBody,
  FreelanceSideSheetContent,
  FreelanceSideSheetFooter,
  FreelanceSideSheetHeader,
} from "@/features/freelance/components/freelance-side-sheet";
import { FreelanceClientsImportSheet } from "@/features/freelance/components/freelance-clients-import-sheet";
import {
  formatCents,
  formatDate,
} from "@/features/freelance/billing-presenter";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  Building2,
  Ellipsis,
  FileClock,
  Loader2,
  PencilLine,
  Plus,
  Receipt,
  Search,
  Trash,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type BillingClientRow = {
  id: string;
  type: BillingClientType;
  displayName: string;
  legalName: string | null;
  contactFirstName: string | null;
  contactLastName: string | null;
  siret: string | null;
  vatNumber: string | null;
  email: string | null;
  phone: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  postalCode: string;
  countryCode: string;
  notes: string | null;
  tags: string[];
  createdAt: Date | string;
  totalInvoicedCents: number;
  totalPaidCents: number;
  totalOutstandingCents: number;
  hasOverdueInvoices: boolean;
  _count: {
    quotes: number;
    invoices: number;
  };
  contacts: {
    id: string;
    position: number;
    firstName: string | null;
    lastName: string | null;
    role: string | null;
    email: string | null;
    phone: string | null;
    includeInEmail: boolean;
    isPrimary: boolean;
    notes: string | null;
  }[];
};

type CompanySearchResult = {
  siren: string;
  siret: string | null;
  displayName: string;
  legalName: string | null;
  vatNumber: string | null;
  addressLine1: string;
  addressLine2: string | null;
  postalCode: string;
  city: string;
  countryCode: string;
};

type FormState = {
  type: BillingClientType;
  displayName: string;
  legalName: string;
  siret: string;
  vatNumber: string;
  companyEmail: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  countryCode: string;
  contacts: {
    key: string;
    lastName: string;
    firstName: string;
    role: string;
    email: string;
    phone: string;
    includeInEmail: boolean;
    isPrimary: boolean;
    notes: string;
  }[];
  notes: string;
  iban: string;
};

const createContactForm = (
  overrides?: Partial<FormState["contacts"][number]>,
): FormState["contacts"][number] => {
  return {
    key:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `contact-${Math.random().toString(36).slice(2, 10)}`,
    lastName: "",
    firstName: "",
    role: "",
    email: "",
    phone: "",
    includeInEmail: false,
    isPrimary: false,
    notes: "",
    ...overrides,
  };
};

const createInitialFormState = (): FormState => ({
  type: BillingClientType.COMPANY,
  displayName: "",
  legalName: "",
  siret: "",
  vatNumber: "",
  companyEmail: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  city: "",
  countryCode: "FR",
  contacts: [createContactForm({ includeInEmail: true, isPrimary: true })],
  notes: "",
  iban: "",
});

const getClientInitials = (label: string) => {
  const normalized = label.trim();
  if (normalized.length === 0) {
    return "CL";
  }

  const words = normalized.split(/\s+/).filter(Boolean);
  const firstWord = words[0] ?? "";
  const secondWord = words[1] ?? "";
  if (words.length === 1) {
    return firstWord.slice(0, 2).toUpperCase();
  }

  return `${firstWord.charAt(0) || "C"}${secondWord.charAt(0) || "L"}`.toUpperCase();
};

const normalizeText = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

export function FreelanceClientsManager() {
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<BillingClientRow[]>([]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [archivingClientId, setArchivingClientId] = useState<string | null>(
    null,
  );
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
  const [pendingHardDeleteClient, setPendingHardDeleteClient] =
    useState<BillingClientRow | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [companySearchResults, setCompanySearchResults] = useState<
    CompanySearchResult[]
  >([]);
  const [isSearchingCompany, setIsSearchingCompany] = useState(false);
  const [activeCreateTab, setActiveCreateTab] = useState<
    "informations" | "contacts" | "notes" | "documents"
  >("informations");
  const [form, setForm] = useState<FormState>(() => createInitialFormState());

  const isEditing = editingClientId !== null;

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const updateContactField = <K extends keyof FormState["contacts"][number]>(
    key: string,
    field: K,
    value: FormState["contacts"][number][K],
  ) => {
    setForm((previous) => ({
      ...previous,
      contacts: previous.contacts.map((contact) =>
        contact.key === key ? { ...contact, [field]: value } : contact,
      ),
    }));
  };

  const addContact = () => {
    setForm((previous) => ({
      ...previous,
      contacts: [...previous.contacts, createContactForm()],
    }));
  };

  const removeContact = (key: string) => {
    setForm((previous) => {
      if (previous.contacts.length <= 1) {
        return previous;
      }

      const nextContacts = previous.contacts.filter(
        (contact) => contact.key !== key,
      );
      if (nextContacts.some((contact) => contact.isPrimary)) {
        return {
          ...previous,
          contacts: nextContacts,
        };
      }

      return {
        ...previous,
        contacts: nextContacts.map((contact, index) => ({
          ...contact,
          isPrimary: index === 0,
        })),
      };
    });
  };

  const loadClients = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await resolveActionResult(
        getBillingClientsAction({
          search,
          page: 1,
          pageSize: 50,
          sortBy: "createdAt",
          sortOrder: "desc",
        }),
      );
      setClients(result.clients as BillingClientRow[]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de charger les clients",
      );
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setIsCreateOpen(true);
      setActiveCreateTab("informations");
    }
  }, [searchParams]);

  const canCreateClient = useMemo(() => {
    if (
      !form.displayName ||
      !form.addressLine1 ||
      !form.postalCode ||
      !form.city
    ) {
      return false;
    }

    if (form.type === BillingClientType.COMPANY && !form.siret) {
      return false;
    }

    return true;
  }, [form]);

  const handleSearchCompany = async () => {
    if (companySearchQuery.trim().length < 2) {
      setCompanySearchResults([]);
      return;
    }

    setIsSearchingCompany(true);
    try {
      const result = await resolveActionResult(
        searchBillingCompaniesAction({
          query: companySearchQuery,
        }),
      );
      setCompanySearchResults(result.companies as CompanySearchResult[]);
    } catch (error) {
      setCompanySearchResults([]);
      toast.error(
        error instanceof Error
          ? error.message
          : "Recherche entreprise indisponible",
      );
    } finally {
      setIsSearchingCompany(false);
    }
  };

  const applyCompanyResult = (company: CompanySearchResult) => {
    setForm((previous) => ({
      ...previous,
      displayName: company.displayName,
      legalName: company.legalName ?? company.displayName,
      siret: company.siret ?? company.siren,
      vatNumber: company.vatNumber ?? previous.vatNumber,
      addressLine1: company.addressLine1,
      addressLine2: company.addressLine2 ?? "",
      postalCode: company.postalCode,
      city: company.city,
      countryCode: company.countryCode,
    }));
    setCompanySearchResults([]);
    toast.success("Informations entreprise pré-remplies");
  };

  const handleCreateClient = async () => {
    if (!canCreateClient) {
      toast.error(
        "Renseigne les champs requis: nom, adresse, code postal, ville et SIRET pour un professionnel",
      );
      return;
    }

    setIsCreating(true);
    try {
      const iban = normalizeText(form.iban);
      const baseNotes = normalizeText(form.notes);
      const normalizedContacts = form.contacts
        .map((contact, index) => ({
          firstName: normalizeText(contact.firstName),
          lastName: normalizeText(contact.lastName),
          role: normalizeText(contact.role),
          email: normalizeText(contact.email),
          phone: normalizeText(contact.phone),
          includeInEmail: contact.includeInEmail,
          isPrimary: contact.isPrimary || index === 0,
          notes: normalizeText(contact.notes),
        }))
        .filter((contact) =>
          [
            contact.firstName,
            contact.lastName,
            contact.role,
            contact.email,
            contact.phone,
            contact.notes,
          ].some((value) => value !== undefined),
        );

      const computedNotes = [
        baseNotes,
        iban ? `IBAN client: ${iban}` : undefined,
      ]
        .filter(Boolean)
        .join("\n");
      const primaryContact = normalizedContacts.find(
        (contact) => contact.isPrimary,
      );
      const normalizedCompanyEmail =
        form.companyEmail.trim().length > 0
          ? form.companyEmail
          : (primaryContact?.email ?? "");
      const normalizedCompanyPhone =
        form.phone.trim().length > 0
          ? form.phone
          : (primaryContact?.phone ?? "");
      const hasSendableContact = normalizedContacts.some(
        (contact) => contact.includeInEmail && Boolean(contact.email),
      );

      if (isEditing && editingClientId) {
        await resolveActionResult(
          updateBillingClientAction({
            id: editingClientId,
            type: form.type,
            displayName: form.displayName,
            legalName: form.legalName,
            contactFirstName: primaryContact?.firstName,
            contactLastName: primaryContact?.lastName,
            email: normalizedCompanyEmail,
            phone: normalizedCompanyPhone,
            vatNumber: form.vatNumber,
            siret: form.siret,
            addressLine1: form.addressLine1,
            addressLine2: form.addressLine2,
            postalCode: form.postalCode,
            city: form.city,
            countryCode: form.countryCode,
            notes: computedNotes,
            tags: hasSendableContact ? ["email-send-enabled"] : [],
            contacts: normalizedContacts,
          }),
        );
        toast.success("Client mis à jour");
      } else {
        await resolveActionResult(
          createBillingClientAction({
            type: form.type,
            displayName: form.displayName,
            legalName: form.legalName,
            contactFirstName: primaryContact?.firstName,
            contactLastName: primaryContact?.lastName,
            email: normalizedCompanyEmail,
            phone: normalizedCompanyPhone,
            vatNumber: form.vatNumber,
            siret: form.siret,
            addressLine1: form.addressLine1,
            addressLine2: form.addressLine2,
            postalCode: form.postalCode,
            city: form.city,
            countryCode: form.countryCode,
            notes: computedNotes,
            tags: hasSendableContact ? ["email-send-enabled"] : [],
            contacts: normalizedContacts,
          }),
        );
        toast.success("Client ajouté");
      }

      setForm(createInitialFormState());
      setEditingClientId(null);
      setCompanySearchQuery("");
      setCompanySearchResults([]);
      setIsCreateOpen(false);
      await loadClients();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la création",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenEditClient = (client: BillingClientRow) => {
    const contactsFromClient =
      client.contacts.length > 0
        ? client.contacts.map((contact) =>
            createContactForm({
              lastName: contact.lastName ?? "",
              firstName: contact.firstName ?? "",
              role: contact.role ?? "",
              email: contact.email ?? "",
              phone: contact.phone ?? "",
              includeInEmail: contact.includeInEmail,
              isPrimary: contact.isPrimary,
              notes: contact.notes ?? "",
            }),
          )
        : [
            createContactForm({
              lastName: client.contactLastName ?? "",
              firstName: client.contactFirstName ?? "",
              email: client.email ?? "",
              phone: client.phone ?? "",
              includeInEmail: client.tags.includes("email-send-enabled"),
              isPrimary: true,
            }),
          ];

    setEditingClientId(client.id);
    setCompanySearchQuery("");
    setCompanySearchResults([]);
    setActiveCreateTab("informations");
    setForm({
      type: client.type,
      displayName: client.displayName,
      legalName: client.legalName ?? "",
      siret: client.siret ?? "",
      vatNumber: client.vatNumber ?? "",
      companyEmail: client.email ?? "",
      phone: client.phone ?? "",
      addressLine1: client.addressLine1,
      addressLine2: client.addressLine2 ?? "",
      postalCode: client.postalCode,
      city: client.city,
      countryCode: client.countryCode,
      contacts: contactsFromClient,
      notes: client.notes ?? "",
      iban: "",
    });
    setIsCreateOpen(true);
  };

  const handleDeleteClient = async (clientId: string) => {
    setArchivingClientId(clientId);
    try {
      await resolveActionResult(deleteBillingClientAction({ id: clientId }));
      toast.success("Client archivé");
      await loadClients();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Suppression impossible",
      );
    } finally {
      setArchivingClientId(null);
    }
  };

  const handleHardDeleteClient = async () => {
    if (!pendingHardDeleteClient) {
      return;
    }

    setDeletingClientId(pendingHardDeleteClient.id);
    try {
      await resolveActionResult(
        hardDeleteBillingClientAction({ id: pendingHardDeleteClient.id }),
      );
      toast.success("Client supprimé définitivement");
      setPendingHardDeleteClient(null);
      await loadClients();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Suppression définitive impossible",
      );
    } finally {
      setDeletingClientId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Clients</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setViewMode("table");
                }}
              >
                Vue tableau
              </Button>
              <Button
                type="button"
                variant={viewMode === "cards" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setViewMode("cards");
                }}
              >
                Vue cards
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setEditingClientId(null);
                  setForm(createInitialFormState());
                  setIsCreateOpen(true);
                  setActiveCreateTab("informations");
                }}
              >
                <Plus className="size-4" />
                Nouveau client
              </Button>
              <FreelanceClientsImportSheet
                onImported={async () => {
                  await loadClients();
                }}
              />
            </div>
          </div>
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-2.5 left-2.5 size-4" />
            <Input
              placeholder="Rechercher dans mes clients..."
              value={search}
              className="pl-8"
              onChange={(event) => {
                setSearch(event.target.value);
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Chargement des clients...
            </div>
          ) : clients.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucun client pour le moment.
            </p>
          ) : viewMode === "table" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Facturé TTC</TableHead>
                  <TableHead>Encaissé</TableHead>
                  <TableHead>Encours</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-full text-xs font-semibold">
                          {getClientInitials(client.displayName)}
                        </div>
                        <div>
                          <p className="font-medium">{client.displayName}</p>
                          <p className="text-muted-foreground text-xs">
                            {client.postalCode} {client.city}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatCents(client.totalInvoicedCents)}
                    </TableCell>
                    <TableCell>{formatCents(client.totalPaidCents)}</TableCell>
                    <TableCell>
                      {formatCents(client.totalOutstandingCents)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          client.hasOverdueInvoices
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {client.hasOverdueInvoices ? "En retard" : "À jour"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(client.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="icon"
                          title="Faire une facture"
                        >
                          <Link
                            href={`/job/gestion/invoices?create=1&clientId=${client.id}`}
                          >
                            <Receipt className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          size="icon"
                          title="Faire un devis"
                        >
                          <Link
                            href={`/job/gestion/quotes?create=1&clientId=${client.id}`}
                          >
                            <FileClock className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          title="Éditer le client"
                          onClick={() => {
                            handleOpenEditClient(client);
                          }}
                        >
                          <PencilLine className="size-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              title="Plus d'actions"
                            >
                              <Ellipsis className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/job/gestion/invoices?create=1&clientId=${client.id}`}
                              >
                                Créer une facture
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/job/gestion/quotes?create=1&clientId=${client.id}`}
                              >
                                Créer un devis
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                handleOpenEditClient(client);
                              }}
                            >
                              <PencilLine className="size-4" />
                              Éditer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={archivingClientId === client.id}
                              onClick={() => {
                                void handleDeleteClient(client.id);
                              }}
                            >
                              {archivingClientId === client.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                              Archiver le client
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={deletingClientId === client.id}
                              onClick={() => {
                                setPendingHardDeleteClient(client);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              {deletingClientId === client.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Trash className="size-4" />
                              )}
                              Supprimer définitivement
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {clients.map((client) => (
                <Card key={client.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-full text-xs font-semibold">
                          {getClientInitials(client.displayName)}
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {client.displayName}
                          </CardTitle>
                          <p className="text-muted-foreground text-xs">
                            {client.postalCode} {client.city}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          client.hasOverdueInvoices
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {client.hasOverdueInvoices ? "En retard" : "À jour"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Facturé TTC</span>
                      <span className="font-medium">
                        {formatCents(client.totalInvoicedCents)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Encaissé</span>
                      <span className="font-medium">
                        {formatCents(client.totalPaidCents)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Encours</span>
                      <span className="font-medium">
                        {formatCents(client.totalOutstandingCents)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Link
                          href={`/job/gestion/invoices?create=1&clientId=${client.id}`}
                        >
                          <Receipt className="size-4" />
                          Facture
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Link
                          href={`/job/gestion/quotes?create=1&clientId=${client.id}`}
                        >
                          <FileClock className="size-4" />
                          Devis
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          handleOpenEditClient(client);
                        }}
                      >
                        <PencilLine className="size-4" />
                        Éditer
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            title="Plus d'actions"
                          >
                            <Ellipsis className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            disabled={archivingClientId === client.id}
                            onClick={() => {
                              void handleDeleteClient(client.id);
                            }}
                          >
                            {archivingClientId === client.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                            Archiver le client
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={deletingClientId === client.id}
                            onClick={() => {
                              setPendingHardDeleteClient(client);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            {deletingClientId === client.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash className="size-4" />
                            )}
                            Supprimer définitivement
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setEditingClientId(null);
            setForm(createInitialFormState());
            setCompanySearchResults([]);
            setCompanySearchQuery("");
          }
        }}
      >
        <FreelanceSideSheetContent>
          <FreelanceSideSheetHeader>
            <SheetTitle>
              {isEditing ? "Éditer le client" : "Nouveau client"}
            </SheetTitle>
            <SheetDescription>
              Renseigne les informations, les contacts et les notes. Tu peux
              rechercher une entreprise par nom, SIREN ou SIRET pour pré-remplir
              le formulaire.
            </SheetDescription>
          </FreelanceSideSheetHeader>

          <FreelanceSideSheetBody>
            <Tabs
              value={activeCreateTab}
              onValueChange={(value) => {
                setActiveCreateTab(
                  value as "informations" | "contacts" | "notes" | "documents",
                );
              }}
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="informations">Informations</TabsTrigger>
                <TabsTrigger value="contacts">Contacts</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="informations" className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Type de client</Label>
                  <RadioGroup
                    value={form.type}
                    onValueChange={(value) => {
                      setField("type", value as BillingClientType);
                    }}
                    className="grid grid-cols-2 gap-3"
                  >
                    <label className="border-muted flex cursor-pointer items-center gap-2 rounded-lg border p-3">
                      <RadioGroupItem
                        value={BillingClientType.COMPANY}
                        id="client-company"
                      />
                      <Building2 className="size-4" />
                      Professionnel
                    </label>
                    <label className="border-muted flex cursor-pointer items-center gap-2 rounded-lg border p-3">
                      <RadioGroupItem
                        value={BillingClientType.INDIVIDUAL}
                        id="client-individual"
                      />
                      <User className="size-4" />
                      Particulier
                    </label>
                  </RadioGroup>
                </div>

                <div className="bg-muted/40 space-y-2 rounded-lg border p-3">
                  <Label>Rechercher votre client (nom, SIREN ou SIRET)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Rechercher votre client"
                      value={companySearchQuery}
                      onChange={(event) => {
                        setCompanySearchQuery(event.target.value);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleSearchCompany();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSearchingCompany}
                      onClick={() => {
                        void handleSearchCompany();
                      }}
                    >
                      {isSearchingCompany ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Search className="size-4" />
                      )}
                      Rechercher
                    </Button>
                  </div>
                  {companySearchResults.length > 0 ? (
                    <div className="max-h-52 space-y-2 overflow-y-auto">
                      {companySearchResults.map((company) => (
                        <div
                          key={`${company.siren}-${company.siret ?? "na"}`}
                          className="bg-background rounded-md border p-3"
                        >
                          <p className="text-sm font-medium">
                            {company.displayName}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            SIREN {company.siren}
                            {company.siret ? ` · SIRET ${company.siret}` : ""}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {company.addressLine1} {company.postalCode}{" "}
                            {company.city}
                          </p>
                          <div className="mt-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                applyCompanyResult(company);
                              }}
                            >
                              Appliquer
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1 md:col-span-2">
                    <Label>Nom affiché</Label>
                    <Input
                      placeholder={
                        form.type === BillingClientType.COMPANY
                          ? "Nom de l'entreprise"
                          : "Nom du client"
                      }
                      value={form.displayName}
                      onChange={(event) => {
                        setField("displayName", event.target.value);
                      }}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label>Raison sociale</Label>
                    <Input
                      placeholder="Raison sociale"
                      value={form.legalName}
                      onChange={(event) => {
                        setField("legalName", event.target.value);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>N° de SIREN ou SIRET</Label>
                    <Input
                      placeholder="SIREN ou SIRET"
                      value={form.siret}
                      onChange={(event) => {
                        setField("siret", event.target.value);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>N° de TVA intracom.</Label>
                    <Input
                      placeholder="FR..."
                      value={form.vatNumber}
                      onChange={(event) => {
                        setField("vatNumber", event.target.value);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Mail</Label>
                    <Input
                      placeholder="contact@client.fr"
                      value={form.companyEmail}
                      onChange={(event) => {
                        setField("companyEmail", event.target.value);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Téléphone</Label>
                    <Input
                      placeholder="06..."
                      value={form.phone}
                      onChange={(event) => {
                        setField("phone", event.target.value);
                      }}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label>Adresse</Label>
                    <Input
                      placeholder="Adresse"
                      value={form.addressLine1}
                      onChange={(event) => {
                        setField("addressLine1", event.target.value);
                      }}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label>Complément d'adresse</Label>
                    <Input
                      placeholder="Bâtiment, étage..."
                      value={form.addressLine2}
                      onChange={(event) => {
                        setField("addressLine2", event.target.value);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Code postal</Label>
                    <Input
                      placeholder="75000"
                      value={form.postalCode}
                      onChange={(event) => {
                        setField("postalCode", event.target.value);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Ville</Label>
                    <Input
                      placeholder="Paris"
                      value={form.city}
                      onChange={(event) => {
                        setField("city", event.target.value);
                      }}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label>Pays</Label>
                    <Input
                      placeholder="FR"
                      maxLength={2}
                      value={form.countryCode}
                      onChange={(event) => {
                        setField(
                          "countryCode",
                          event.target.value.toUpperCase(),
                        );
                      }}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label>IBAN</Label>
                    <Input
                      placeholder="FR76..."
                      value={form.iban}
                      onChange={(event) => {
                        setField("iban", event.target.value);
                      }}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contacts" className="space-y-4 pt-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-muted-foreground text-sm">
                    {form.contacts.length} contact(s)
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addContact}
                  >
                    <Plus className="size-4" />
                    Ajouter un contact
                  </Button>
                </div>

                <div className="space-y-3">
                  {form.contacts.map((contact, index) => (
                    <div
                      key={contact.key}
                      className="space-y-3 rounded-lg border p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">
                          Contact n°{index + 1}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={form.contacts.length <= 1}
                          onClick={() => {
                            removeContact(contact.key);
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label>Nom</Label>
                          <Input
                            placeholder="Nom"
                            value={contact.lastName}
                            onChange={(event) => {
                              updateContactField(
                                contact.key,
                                "lastName",
                                event.target.value,
                              );
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Prénom</Label>
                          <Input
                            placeholder="Prénom"
                            value={contact.firstName}
                            onChange={(event) => {
                              updateContactField(
                                contact.key,
                                "firstName",
                                event.target.value,
                              );
                            }}
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <Label>Fonction</Label>
                          <Input
                            placeholder="Fonction"
                            value={contact.role}
                            onChange={(event) => {
                              updateContactField(
                                contact.key,
                                "role",
                                event.target.value,
                              );
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Mail</Label>
                          <Input
                            placeholder="prenom.nom@client.fr"
                            value={contact.email}
                            onChange={(event) => {
                              updateContactField(
                                contact.key,
                                "email",
                                event.target.value,
                              );
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Téléphone</Label>
                          <Input
                            placeholder="06..."
                            value={contact.phone}
                            onChange={(event) => {
                              updateContactField(
                                contact.key,
                                "phone",
                                event.target.value,
                              );
                            }}
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <Label>Note contact (optionnel)</Label>
                          <Input
                            placeholder="Ex: préfère être contacté le matin"
                            value={contact.notes}
                            onChange={(event) => {
                              updateContactField(
                                contact.key,
                                "notes",
                                event.target.value,
                              );
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                          <Label className="text-sm">
                            Inclure cette adresse lors des envois par mail
                          </Label>
                          <Switch
                            checked={contact.includeInEmail}
                            onCheckedChange={(checked) => {
                              updateContactField(
                                contact.key,
                                "includeInEmail",
                                checked,
                              );
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                          <Label className="text-sm">Contact principal</Label>
                          <Switch
                            checked={contact.isPrimary}
                            onCheckedChange={(checked) => {
                              setForm((previous) => ({
                                ...previous,
                                contacts: previous.contacts.map((entry) => ({
                                  ...entry,
                                  isPrimary: checked
                                    ? entry.key === contact.key
                                    : false,
                                })),
                              }));
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4 pt-2">
                <div className="text-muted-foreground space-y-2 rounded-lg border border-dashed p-6 text-center">
                  <FileClock className="mx-auto size-8 opacity-50" />
                  <p className="text-sm">Devis et factures à venir</p>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label>Notes sur le client</Label>
                  <Textarea
                    rows={8}
                    placeholder="Notes sur le client"
                    value={form.notes}
                    onChange={(event) => {
                      setField("notes", event.target.value);
                    }}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </FreelanceSideSheetBody>

          <FreelanceSideSheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={isCreating || !canCreateClient}
              onClick={() => {
                void handleCreateClient();
              }}
            >
              {isCreating ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEditing ? "Enregistrer" : "Créer"}
            </Button>
          </FreelanceSideSheetFooter>
        </FreelanceSideSheetContent>
      </Sheet>

      <AlertDialog
        open={pendingHardDeleteClient !== null}
        onOpenChange={(open) => {
          if (!open && deletingClientId === null) {
            setPendingHardDeleteClient(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer définitivement le client
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le client{" "}
              <strong>{pendingHardDeleteClient?.displayName ?? ""}</strong> sera
              retiré définitivement de la base Jobio. Les documents/paiements
              liés seront automatiquement réaffectés à un client système "Client
              supprimé" pour conserver l’historique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingClientId !== null}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deletingClientId !== null}
              onClick={(event) => {
                event.preventDefault();
                void handleHardDeleteClient();
              }}
            >
              {deletingClientId !== null ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
