import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { UploadFileAdapter } from "./upload-file";
import { extensionForImageMimeType } from "./image-validation";

const normalizePathSegment = (value: string) => {
  const sanitized = value.replace(/[^a-zA-Z0-9/_-]/g, "");
  return sanitized.length > 0 ? sanitized : "files";
};

const writeFileToPublic = async (input: { file: File; path: string }) => {
  const extension = extensionForImageMimeType(input.file.type);
  const directory = path.posix.join(
    "uploads",
    normalizePathSegment(input.path),
  );
  const absoluteDirectory = path.join(process.cwd(), "public", directory);
  const filename = `${Date.now()}-${randomUUID()}.${extension}`;
  const absoluteFilepath = path.join(absoluteDirectory, filename);

  await mkdir(absoluteDirectory, { recursive: true });
  const bytes = await input.file.arrayBuffer();
  await writeFile(absoluteFilepath, Buffer.from(bytes));

  return {
    url: `/${directory}/${filename}`,
    pathname: path.posix.join(directory, filename),
    provider: "LOCAL" as const,
  };
};

export const fileAdapter: UploadFileAdapter = {
  uploadFile: async (params) => {
    try {
      const data = await writeFileToPublic(params);
      return {
        error: null,
        data,
      };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error
            : new Error("Failed to upload file locally"),
        data: null,
      };
    }
  },
  uploadFiles: async (params) => {
    return Promise.all(
      params.map(async (param) => {
        try {
          const data = await writeFileToPublic(param);
          return {
            error: null,
            data,
          };
        } catch (error) {
          return {
            error:
              error instanceof Error
                ? error
                : new Error("Failed to upload file locally"),
            data: null,
          };
        }
      }),
    );
  },
};
