import { prisma } from "@/lib/prisma";
import {
  formatCents,
  formatDate,
  quoteStatusLabel,
} from "@/features/freelance/billing-presenter";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function PublicQuotePage({ params }: Props) {
  const { token } = await params;

  const quote = await prisma.billingQuote.findUnique({
    where: { shareToken: token },
    include: {
      client: true,
      lines: {
        orderBy: { position: "asc" },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!quote || quote.deletedAt) {
    notFound();
  }

  const profile = await prisma.billingProfile.findUnique({
    where: { userId: quote.userId },
  });

  const vatGroups = quote.lines.reduce<Record<number, number>>((acc, line) => {
    const rate = line.vatRatePercent;
    acc[rate] = (acc[rate] ?? 0) + line.taxCents;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Devis {quote.number ?? "Brouillon"}
            </h1>
            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
              <span>Émis le {formatDate(quote.issueDate)}</span>
              {quote.validUntil ? (
                <span>· Valide jusqu'au {formatDate(quote.validUntil)}</span>
              ) : null}
            </div>
            <div className="mt-2">
              <Badge variant="outline">{quoteStatusLabel[quote.status]}</Badge>
            </div>
          </div>
          {profile?.documentLogoUrl ? (
            <img
              src={profile.documentLogoUrl}
              alt="Logo"
              className="h-16 w-auto object-contain"
            />
          ) : null}
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-8 border-b border-gray-100 p-8">
          <div className="flex flex-col gap-1">
            <p className="mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
              De
            </p>
            <p className="font-semibold text-gray-900">
              {profile?.tradeName ?? profile?.legalName ?? quote.user.name}
            </p>
            {profile?.siret ? (
              <p className="text-sm text-gray-500">SIRET : {profile.siret}</p>
            ) : null}
            {profile?.vatNumber ? (
              <p className="text-sm text-gray-500">TVA : {profile.vatNumber}</p>
            ) : null}
            {profile?.addressLine1 ? (
              <p className="text-sm text-gray-500">{profile.addressLine1}</p>
            ) : null}
            {profile?.addressLine2 ? (
              <p className="text-sm text-gray-500">{profile.addressLine2}</p>
            ) : null}
            {profile?.postalCode || profile?.city ? (
              <p className="text-sm text-gray-500">
                {[profile.postalCode, profile.city].filter(Boolean).join(" ")}
              </p>
            ) : null}
            {profile?.email ? (
              <p className="text-sm text-gray-500">{profile.email}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1">
            <p className="mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
              À
            </p>
            <p className="font-semibold text-gray-900">
              {quote.client.displayName}
            </p>
            {quote.client.siret ? (
              <p className="text-sm text-gray-500">
                SIRET : {quote.client.siret}
              </p>
            ) : null}
            {quote.client.vatNumber ? (
              <p className="text-sm text-gray-500">
                TVA : {quote.client.vatNumber}
              </p>
            ) : null}
            {quote.client.addressLine1 ? (
              <p className="text-sm text-gray-500">
                {quote.client.addressLine1}
              </p>
            ) : null}
            {quote.client.addressLine2 ? (
              <p className="text-sm text-gray-500">
                {quote.client.addressLine2}
              </p>
            ) : null}
            {quote.client.postalCode || quote.client.city ? (
              <p className="text-sm text-gray-500">
                {[quote.client.postalCode, quote.client.city]
                  .filter(Boolean)
                  .join(" ")}
              </p>
            ) : null}
            {quote.client.email ? (
              <p className="text-sm text-gray-500">{quote.client.email}</p>
            ) : null}
          </div>
        </div>

        {/* Lignes */}
        <div className="p-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs tracking-wider text-gray-400 uppercase">
                <th className="pb-3 text-left font-semibold">Description</th>
                <th className="pb-3 text-right font-semibold">Qté</th>
                <th className="pb-3 text-right font-semibold">PU HT</th>
                <th className="pb-3 text-right font-semibold">TVA</th>
                <th className="pb-3 text-right font-semibold">Total HT</th>
              </tr>
            </thead>
            <tbody>
              {quote.lines.map((line) => (
                <tr
                  key={line.id}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="py-3 pr-4 text-gray-800">
                    {line.description}
                  </td>
                  <td className="py-3 text-right text-gray-700 tabular-nums">
                    {line.quantity}
                  </td>
                  <td className="py-3 text-right text-gray-700 tabular-nums">
                    {formatCents(line.unitPriceCents)}
                  </td>
                  <td className="py-3 text-right text-gray-500 tabular-nums">
                    {line.vatRatePercent} %
                  </td>
                  <td className="py-3 text-right font-medium text-gray-900 tabular-nums">
                    {formatCents(line.subtotalCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totaux */}
          <div className="mt-6 flex flex-col items-end gap-2">
            <Separator className="mb-2 w-64" />
            <div className="flex w-64 justify-between text-sm text-gray-600">
              <span>Sous-total HT</span>
              <span className="tabular-nums">
                {formatCents(quote.subtotalCents)}
              </span>
            </div>
            {Object.entries(vatGroups).map(([rate, amount]) => (
              <div
                key={rate}
                className="flex w-64 justify-between text-sm text-gray-600"
              >
                <span>TVA ({rate} %)</span>
                <span className="tabular-nums">{formatCents(amount)}</span>
              </div>
            ))}
            {quote.discountCents > 0 ? (
              <div className="flex w-64 justify-between text-sm text-gray-600">
                <span>Remise</span>
                <span className="text-green-600 tabular-nums">
                  -{formatCents(quote.discountCents)}
                </span>
              </div>
            ) : null}
            <Separator className="my-1 w-64" />
            <div className="flex w-64 justify-between text-base font-bold text-gray-900">
              <span>Total TTC</span>
              <span className="tabular-nums">
                {formatCents(quote.totalCents)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes et conditions */}
        {quote.notes || quote.terms ? (
          <div className="flex flex-col gap-4 border-t border-gray-100 p-8">
            {quote.notes ? (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  Notes
                </p>
                <p className="text-sm whitespace-pre-wrap text-gray-600">
                  {quote.notes}
                </p>
              </div>
            ) : null}
            {quote.terms ? (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  Conditions
                </p>
                <p className="text-sm whitespace-pre-wrap text-gray-600">
                  {quote.terms}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Pied de page */}
        <div className="border-t border-gray-100 bg-gray-50 px-8 py-4">
          <p className="text-center text-xs text-gray-400">
            {profile?.documentFooterText ??
              "Document généré via Jobio — plateforme de gestion freelance"}
          </p>
        </div>
      </div>
    </div>
  );
}
