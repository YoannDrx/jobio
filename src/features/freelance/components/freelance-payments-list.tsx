"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getBillingPaymentsAction } from "@/features/freelance/billing-documents.action";
import { formatCents, formatDate } from "@/features/freelance/billing-presenter";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type PaymentRow = {
  id: string;
  amountCents: number;
  method: string;
  status: string;
  paidAt: Date | string;
  client: {
    displayName: string;
  };
  allocations: {
    amountCents: number;
    invoice: {
      number: string | null;
    };
  }[];
};

export function FreelancePaymentsList() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await resolveActionResult(
        getBillingPaymentsAction({
          page: 1,
          pageSize: 100,
        }),
      );
      setPayments(result.payments as PaymentRow[]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de charger les paiements",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registre des paiements</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Chargement des paiements...
          </div>
        ) : payments.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun paiement enregistré.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Facture</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDate(payment.paidAt)}</TableCell>
                  <TableCell>{payment.client.displayName}</TableCell>
                  <TableCell>
                    {payment.allocations.at(0)?.invoice.number ?? "Sans facture"}
                  </TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{payment.status}</Badge>
                  </TableCell>
                  <TableCell>{formatCents(payment.amountCents)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
