import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import type { UploadFileAdapter } from "./upload-file";
import { extensionForImageMimeType } from "./image-validation";

const buildPathname = (file: File, directory: string) => {
  const safeDirectory = directory.replace(/[^a-zA-Z0-9/_-]/g, "");
  const extension = extensionForImageMimeType(file.type);
  return `${safeDirectory}/${randomUUID()}.${extension}`;
};

export const fileAdapter: UploadFileAdapter = {
  uploadFile: async (params) => {
    try {
      const file = params.file;

      const blob = await put(buildPathname(file, params.path), file, {
        access: "public",
        addRandomSuffix: false,
      });

      return {
        error: null,
        data: {
          url: blob.url,
          pathname: blob.pathname,
          provider: "VERCEL_BLOB" as const,
        },
      };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error : new Error("Failed to upload file"),
        data: null,
      };
    }
  },
  uploadFiles: async (params) => {
    const promises = params.map(async (param) => {
      try {
        const blob = await put(
          buildPathname(param.file, param.path),
          param.file,
          {
            access: "public",
            addRandomSuffix: false,
          },
        );

        return {
          error: null,
          data: {
            url: blob.url,
            pathname: blob.pathname,
            provider: "VERCEL_BLOB" as const,
          },
        };
      } catch (error) {
        return {
          error:
            error instanceof Error ? error : new Error("Failed to upload file"),
          data: null,
        };
      }
    });

    return Promise.all(promises);
  },
};
