import { AutomaticPagination } from "@/components/nowts/automatic-pagination";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getUsersWithStats } from "../_actions/admin-users";
import { UserRow } from "./user-row";

type UserTableProps = {
  searchParams: {
    page: number;
    search: string;
    role: "all" | "admin" | "user";
    status: "all" | "active" | "banned" | "unverified";
    plan: "all" | "free" | "pro";
    sortBy:
      | "createdAt"
      | "name"
      | "email"
      | "missions"
      | "sessions"
      | "lastActivity";
    order: "asc" | "desc";
  };
};

export const UserTable = async ({ searchParams }: UserTableProps) => {
  const pageSize = 10;
  const currentPage = searchParams.page;

  const { users, totalPages } = await getUsersWithStats({
    page: currentPage,
    pageSize,
    search: searchParams.search || undefined,
    role: searchParams.role,
    status: searchParams.status,
    plan: searchParams.plan,
    sortBy: searchParams.sortBy,
    order: searchParams.order,
  });

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Missions</TableHead>
            <TableHead>Sessions actives</TableHead>
            <TableHead>Dernière activité</TableHead>
            <TableHead>Créé le</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </TableBody>
      </Table>

      <AutomaticPagination
        currentPage={currentPage}
        totalPages={totalPages}
        paramName="page"
        queryParams={{
          search: searchParams.search,
          role: searchParams.role,
          status: searchParams.status,
          plan: searchParams.plan,
          sortBy: searchParams.sortBy,
          order: searchParams.order,
        }}
      />
    </>
  );
};
