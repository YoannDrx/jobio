import { exportAccountData } from "@/features/account/account-data-export";
import { authRoute } from "@/lib/zod-route";

export const GET = authRoute.handler(async (_req, { ctx }) => {
  const exportedAt = new Date();
  const payload = await exportAccountData(ctx.user.id);
  const filename = `jobio-export-${exportedAt.toISOString().slice(0, 10)}.json`;

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
