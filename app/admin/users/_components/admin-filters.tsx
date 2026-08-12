"use client";

import { Download, Search } from "lucide-react";
import { useQueryStates } from "nuqs";
import { toast } from "sonner";
import { adminSearchParams } from "../_actions/search-params";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { exportUsersAction } from "../_actions/export-users.action";
import { runBulkUsersAction } from "../_actions/bulk-users.action";
import { downloadCsv, generateCsv } from "@/lib/csv-export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useRouter } from "next/navigation";

export const AdminFilters = () => {
  const router = useRouter();
  const [filters, setFilters] = useQueryStates(adminSearchParams, {
    shallow: false,
    throttleMs: 300,
  });
  const [bulkAction, setBulkAction] = useState<
    "ban" | "unban" | "make_admin" | "make_user"
  >("ban");

  const handleExport = async () => {
    try {
      const rows = await resolveActionResult(
        exportUsersAction({
          search: filters.search || undefined,
          role: filters.role,
          status: filters.status,
          plan: filters.plan,
          sortBy: filters.sortBy,
          order: filters.order,
        }),
      );

      const csv = generateCsv(rows, [
        { key: "id", header: "ID" },
        { key: "name", header: "Nom" },
        { key: "email", header: "Email" },
        { key: "role", header: "Rôle" },
        { key: "plan", header: "Plan" },
        { key: "status", header: "Statut" },
        { key: "missions", header: "Missions" },
        { key: "activeSessions", header: "Sessions actives" },
        { key: "subscriptionStatus", header: "Statut abonnement" },
        { key: "lastActivity", header: "Dernière activité" },
        { key: "createdAt", header: "Créé le" },
      ]);

      downloadCsv(
        csv,
        `admin-users-${new Date().toISOString().split("T")[0]}.csv`,
      );
      toast.success("Export utilisateurs téléchargé");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible d'exporter les utilisateurs",
      );
    }
  };

  const handleBulkAction = async () => {
    const actionLabel =
      bulkAction === "ban"
        ? "bannir"
        : bulkAction === "unban"
          ? "débannir"
          : bulkAction === "make_admin"
            ? "passer admin"
            : "passer user";

    const shouldProceed = window.confirm(
      `Confirmer l'action bulk "${actionLabel}" sur les utilisateurs filtrés (max 500) ?`,
    );

    if (!shouldProceed) {
      return;
    }

    try {
      const result = await resolveActionResult(
        runBulkUsersAction({
          action: bulkAction,
          search: filters.search || undefined,
          role: filters.role,
          status: filters.status,
          plan: filters.plan,
          sortBy: filters.sortBy,
          order: filters.order,
          maxUsers: 500,
        }),
      );

      toast.success(
        `Action bulk terminée: ${result.updatedCount} utilisateur(s) mis à jour`,
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible d'exécuter l'action bulk",
      );
    }
  };

  return (
    <div className="grid gap-3 rounded-lg border p-3 xl:grid-cols-[1.3fr_repeat(5,minmax(0,1fr))_minmax(0,1fr)_auto_auto]">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder="Rechercher nom ou email..."
          value={filters.search}
          onChange={(e) => {
            void setFilters({
              search: e.target.value,
              page: 1,
            });
          }}
          className="pl-10"
        />
      </div>

      <Select
        value={filters.role}
        onValueChange={(value: "all" | "admin" | "user") => {
          void setFilters({
            role: value,
            page: 1,
          });
        }}
      >
        <SelectTrigger size="sm">
          <SelectValue placeholder="Rôle" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous rôles</SelectItem>
          <SelectItem value="admin">Admins</SelectItem>
          <SelectItem value="user">Users</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(value: "all" | "active" | "banned" | "unverified") => {
          void setFilters({
            status: value,
            page: 1,
          });
        }}
      >
        <SelectTrigger size="sm">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous statuts</SelectItem>
          <SelectItem value="active">Actifs</SelectItem>
          <SelectItem value="banned">Bannis</SelectItem>
          <SelectItem value="unverified">Non vérifiés</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.plan}
        onValueChange={(value: "all" | "free" | "pro") => {
          void setFilters({
            plan: value,
            page: 1,
          });
        }}
      >
        <SelectTrigger size="sm">
          <SelectValue placeholder="Plan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous plans</SelectItem>
          <SelectItem value="free">Free</SelectItem>
          <SelectItem value="pro">Pro</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.sortBy}
        onValueChange={(
          value:
            | "createdAt"
            | "name"
            | "email"
            | "missions"
            | "sessions"
            | "lastActivity",
        ) => {
          void setFilters({
            sortBy: value,
            page: 1,
          });
        }}
      >
        <SelectTrigger size="sm">
          <SelectValue placeholder="Tri" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="createdAt">Tri: création</SelectItem>
          <SelectItem value="lastActivity">Tri: activité</SelectItem>
          <SelectItem value="missions">Tri: missions</SelectItem>
          <SelectItem value="sessions">Tri: sessions</SelectItem>
          <SelectItem value="name">Tri: nom</SelectItem>
          <SelectItem value="email">Tri: email</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.order}
        onValueChange={(value: "asc" | "desc") => {
          void setFilters({
            order: value,
            page: 1,
          });
        }}
      >
        <SelectTrigger size="sm">
          <SelectValue placeholder="Ordre" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="desc">Desc</SelectItem>
          <SelectItem value="asc">Asc</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={bulkAction}
        onValueChange={(
          value: "ban" | "unban" | "make_admin" | "make_user",
        ) => {
          setBulkAction(value);
        }}
      >
        <SelectTrigger size="sm">
          <SelectValue placeholder="Action bulk" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ban">Bulk: bannir</SelectItem>
          <SelectItem value="unban">Bulk: débannir</SelectItem>
          <SelectItem value="make_admin">Bulk: passer admin</SelectItem>
          <SelectItem value="make_user">Bulk: passer user</SelectItem>
        </SelectContent>
      </Select>

      <Button
        size="sm"
        variant="outline"
        onClick={() => void handleBulkAction()}
      >
        Exécuter bulk
      </Button>

      <Button size="sm" variant="outline" onClick={() => void handleExport()}>
        <Download className="size-4" />
        Export CSV
      </Button>
    </div>
  );
};
