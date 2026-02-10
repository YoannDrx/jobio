"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Mail } from "lucide-react";

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

type ContactListProps = {
  contacts: Contact[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  onSearchChange: (search: string) => void;
  onPageChange: (page: number) => void;
  onContactClick: (contactId: string) => void;
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
}: ContactListProps) {
  const totalPages = Math.ceil(total / pageSize);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Rechercher un contact..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Nom complet</TableHead>
              <TableHead className="w-[150px]">Entreprise</TableHead>
              <TableHead className="w-[150px]">Email</TableHead>
              <TableHead className="w-[100px]">Rôle</TableHead>
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
                onClick={() => onContactClick(contact.id)}
              >
                <TableCell className="font-medium">
                  {contact.firstName} {contact.lastName}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
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
                <TableCell className="text-muted-foreground text-sm">
                  {contact.role ?? "-"}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{contact._count.missions}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">
                    {contact._count.interactions}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
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
    </div>
  );
}
