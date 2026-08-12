import { unlink } from "node:fs/promises";
import path from "node:path";

import type { UserAsset } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";

type DeletableAsset = Pick<UserAsset, "pathname" | "provider" | "url">;

const deleteLocalAsset = async (pathname: string) => {
  const publicRoot = path.resolve(process.cwd(), "public");
  const absolutePath = path.resolve(publicRoot, pathname);
  if (!absolutePath.startsWith(`${publicRoot}${path.sep}uploads${path.sep}`)) {
    throw new Error("INVALID_LOCAL_ASSET_PATH");
  }
  try {
    await unlink(absolutePath);
  } catch (error) {
    if (
      typeof error !== "object" ||
      error === null ||
      !("code" in error) ||
      error.code !== "ENOENT"
    ) {
      throw error;
    }
  }
};

export const deleteStoredAssets = async (assets: DeletableAsset[]) => {
  const blobUrls = assets
    .filter((asset) => asset.provider === "VERCEL_BLOB")
    .map((asset) => asset.url);
  if (blobUrls.length > 0) await del(blobUrls);
  await Promise.all(
    assets
      .filter((asset) => asset.provider === "LOCAL")
      .map(async (asset) => deleteLocalAsset(asset.pathname)),
  );
};

export const deleteUserAssets = async (userId: string) => {
  const assets = await prisma.userAsset.findMany({
    where: { userId },
    select: { pathname: true, provider: true, url: true },
  });
  await deleteStoredAssets(assets);
};
