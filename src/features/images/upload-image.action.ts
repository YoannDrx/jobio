"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { fileAdapter as localFileAdapter } from "@/lib/files/local-upload-adapter";
import { fileAdapter as blobFileAdapter } from "@/lib/files/vercel-blob-adapter";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { deleteStoredAssets } from "@/lib/files/delete-user-assets";
import { hasValidImageSignature } from "@/lib/files/image-validation";

export const uploadImageAction = authAction
  .inputSchema(
    z.object({
      formData: z.instanceof(FormData),
    }),
  )
  .action(async ({ parsedInput: { formData }, ctx: { user } }) => {
    const files = formData.get("files") as File | File[];

    let file: File;

    if (Array.isArray(files)) {
      file = files[0];
    } else {
      file = files;
    }

    if (!(file instanceof File)) {
      throw new ActionError("Invalid file (not a file)");
    }

    // If file is not an image throw an error
    if (!(await hasValidImageSignature(file))) {
      throw new ActionError("Invalid file (PNG, JPEG, GIF or WebP required)");
    }

    // If file is too large throw an error (max 2mb)
    if (file.size > 2 * 1024 * 1024) {
      throw new ActionError("File too large (max 2mb)");
    }

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
    const preferBlobAdapter = Boolean(blobToken && blobToken.length > 0);

    let response = await (preferBlobAdapter
      ? blobFileAdapter.uploadFile({
          file,
          path: `users/${user.id}/images`,
        })
      : localFileAdapter.uploadFile({
          file,
          path: `users/${user.id}/images`,
        }));

    // Fail-safe: local fallback if Blob token is missing/invalid at runtime.
    if (
      response.error &&
      preferBlobAdapter &&
      /No token found|BLOB_READ_WRITE_TOKEN|token/i.test(response.error.message)
    ) {
      response = await localFileAdapter.uploadFile({
        file,
        path: `users/${user.id}/images`,
      });
    }

    if (response.error) {
      throw new ActionError(response.error.message);
    }

    try {
      await prisma.userAsset.create({
        data: {
          userId: user.id,
          url: response.data.url,
          pathname: response.data.pathname,
          provider: response.data.provider,
          mimeType: file.type,
          sizeBytes: file.size,
        },
      });
    } catch (error) {
      await deleteStoredAssets([response.data]);
      throw error;
    }

    return response.data.url;
  });
