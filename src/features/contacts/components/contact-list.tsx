"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  bulkAddTagAction,
  bulkDeleteContactsAction,
  triggerContactNextActionAction,
} from "@/features/contacts/contacts.action";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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

type ContactListProps = {
  contacts: Contact[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  onSearchChange: (search: string) => void;
  onPageChange: (page: number) => void;
  onContactClick: (contactId: string) => void;
  tagFilter?: string;
  onTagFilterChange?: (tag: string) => void;
  sortBy: "createdAt" | "firstName" | "lastName" | "relationshipScore";
  sortOrder: "asc" | "desc";
  onSortChange: (
    sortBy: "createdAt" | "firstName" | "lastName" | "relationshipScore",
    sortOrder: "asc" | "desc",
  ) => void;
  relationshipTierFilter: "" | "hot" | "warm" | "cold";
  onRelationshipTierChange: (tier: "" | "hot" | "warm" | "cold") => void;
  availableTags?: string[];
  onDataChanged?: () => void;
};

export function ContactList({
  contacts,
  total,
  page,
  pageSize,
  search,
  onSearchChange,
  onPageChange,
  onContactClick,
  tagFilter,
  onTagFilterChange,
  sortBy,
  sortOrder,
  onSortChange,
  relationshipTierFilter,
  onRelationshipTierChange,
  availableTags = [],
  onDataChanged,
}: ContactListProps) {
  const router = useRouter();
  const totalPages = Math.ceil(total / pageSize);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  const tierLabel: Record<Contact["relationshipTier"], string> = {
    hot: "Hot",
    warm: "Warm",
    cold: "Cold",
  };
  const tierClassName: Record<Contact["relationshipTier"], string> = {
    hot: "border-emerald-200 text-emerald-700",
    warm: "border-amber-200 text-amber-700",
    cold: "border-slate-200 text-slate-600",
  };
  const sortValue = `${sortBy}:${sortOrder}`;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [isPending, startTransition] = useTransition();
  const [nextActionContactId, setNextActionContactId] = useState<string | null>(
    null,
  );

  const allSelected =
    contacts.length > 0 && contacts.every((c) => selectedIds.has(c.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map((c) => c.id)));
    }
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    startTransition(async () => {
      const result = await resolveActionResult(
        bulkDeleteContactsAction({ ids }),
      );
      toast.success(`${result.deleted} contact(s) supprime(s)`);
      setSelectedIds(new Set());
      onDataChanged?.();
    });
  };

  const handleBulkAddTag = () => {
    if (!newTag.trim()) return;
    const ids = Array.from(selectedIds);
    startTransition(async () => {
      const result = await resolveActionResult(
        bulkAddTagAction({ ids, tag: newTag.trim() }),
      );
      toast.success(`Tag ajoute a ${result.updated} contact(s)`);
      setSelectedIds(new Set());
      setTagDialogOpen(false);
      setNewTag("");
      onDataChanged?.();
    });
  };

  const handleTriggerNextAction = async (contactId: string) => {
    setNextActionContactId(contactId);
    try {
      const result = await resolveActionResult(
        triggerContactNextActionAction({ contactId }),
      );
      if (result.kind === "created") {
        toast.success("Relance créée automatiquement");
        router.push(`/app/pipeline?missionId=${result.missionId}`);
        return;
      }
      if (result.kind === "already_planned") {
        toast.info("Une relance est déjà prévue cette semaine");
        router.push(`/app/pipeline?missionId=${result.missionId}`);
        return;
      }
      toast.info(result.message);
      onContactClick(contactId);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de lancer l'action",
      );
    } finally {
      setNextActionContactId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="bg-muted flex items-center gap-3 rounded-lg px-4 py-2">
          <span className="text-sm font-medium">
            {selectedIds.size} selectionne(s)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTagDialogOpen(true)}
            disabled={isPending}
          >
            <Tag className="size-4" />
            Ajouter tag
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={isPending}
          >
            <Trash2 className="size-4" />
            Supprimer ({selectedIds.size})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
          >
            Annuler
          </Button>
        </div>
      )}

      {/* Search + Tag filter */}
      <div className="flex gap-2">
        <Input
          placeholder="Rechercher un contact..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1"
        />
        <Select
          value={sortValue}
          onValueChange={(value) => {
            const [nextSortBy, nextSortOrder] = value.split(":") as [
              "createdAt" | "firstName" | "lastName" | "relationshipScore",
              "asc" | "desc",
            ];
            onSortChange(nextSortBy, nextSortOrder);
          }}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Tri" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt:desc">Plus récents</SelectItem>
            <SelectItem value="createdAt:asc">Plus anciens</SelectItem>
            <SelectItem value="relationshipScore:desc">
              Relation la plus forte
            </SelectItem>
            <SelectItem value="relationshipScore:asc">
              Relation la plus faible
            </SelectItem>
            <SelectItem value="firstName:asc">Prénom A → Z</SelectItem>
            <SelectItem value="lastName:asc">Nom A → Z</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={relationshipTierFilter || "all"}
          onValueChange={(value) =>
            onRelationshipTierChange(
              value === "all" ? "" : (value as "hot" | "warm" | "cold"),
            )
          }
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Relation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous niveaux</SelectItem>
            <SelectItem value="hot">Hot</SelectItem>
            <SelectItem value="warm">Warm</SelectItem>
            <SelectItem value="cold">Cold</SelectItem>
          </SelectContent>
        </Select>
        {availableTags.length > 0 && onTagFilterChange && (
          <Select
            value={tagFilter ?? ""}
            onValueChange={(value) =>
              onTagFilterChange(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer par tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les tags</SelectItem>
              {availableTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Selectionner tout"
                />
              </TableHead>
              <TableHead className="w-[200px]">Nom complet</TableHead>
              <TableHead className="w-[150px]">Entreprise</TableHead>
              <TableHead className="w-[150px]">Email</TableHead>
              <TableHead className="w-[100px]">Role</TableHead>
              <TableHead className="w-[150px]">Tags</TableHead>
              <TableHead className="w-[210px]">Relation</TableHead>
              <TableHead className="w-[80px] text-center">Missions</TableHead>
              <TableHead className="w-[80px] text-center">
                Interactions
              </TableHead>
              <TableHead className="w-[120px]">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow
                key={contact.id}
                className="hover:bg-muted/50 cursor-pointer"
                data-selected={selectedIds.has(contact.id) || undefined}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(contact.id)}
                    onCheckedChange={() => toggleSelect(contact.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Selectionner ${contact.firstName} ${contact.lastName}`}
                  />
                </TableCell>
                <TableCell
                  className="font-medium"
                  onClick={() => onContactClick(contact.id)}
                >
                  {contact.firstName} {contact.lastName}
                </TableCell>
                <TableCell
                  className="text-muted-foreground text-sm"
                  onClick={() => onContactClick(contact.id)}
                >
                  {contact.company ?? "-"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {contact.email ? (
                    <a
                      href={`mailto:${contact.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 hover:underline"
                    >
                      <Mail className="size-3" />
                      {contact.email}
                    </a>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell
                  className="text-muted-foreground text-sm"
                  onClick={() => onContactClick(contact.id)}
                >
                  {contact.role ?? "-"}
                </TableCell>
                <TableCell onClick={() => onContactClick(contact.id)}>
                  {contact.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell onClick={() => onContactClick(contact.id)}>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={tierClassName[contact.relationshipTier]}
                      >
                        {tierLabel[contact.relationshipTier]}
                      </Badge>
                      <span className="text-sm font-semibold">
                        {contact.relationshipScore}/100
                      </span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {contact.relationshipNextAction}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1 h-7 px-2 text-xs"
                      disabled={nextActionContactId === contact.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleTriggerNextAction(contact.id);
                      }}
                    >
                      {nextActionContactId === contact.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Sparkles className="size-3" />
                      )}
                      Action
                    </Button>
                  </div>
                </TableCell>
                <TableCell
                  className="text-center"
                  onClick={() => onContactClick(contact.id)}
                >
                  <Badge variant="outline">{contact._count.missions}</Badge>
                </TableCell>
                <TableCell
                  className="text-center"
                  onClick={() => onContactClick(contact.id)}
                >
                  <Badge variant="secondary">
                    {contact._count.interactions}
                  </Badge>
                </TableCell>
                <TableCell
                  className="text-muted-foreground text-sm"
                  onClick={() => onContactClick(contact.id)}
                >
                  {new Date(contact.createdAt).toLocaleDateString("fr-FR")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-sm">
          {total === 0
            ? "Aucun contact"
            : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} sur ${total}`}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrev}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-1 px-2">
            <span className="text-sm">
              {page} / {totalPages}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNext}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Tag dialog */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un tag</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Nom du tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleBulkAddTag();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleBulkAddTag}
              disabled={!newTag.trim() || isPending}
            >
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
