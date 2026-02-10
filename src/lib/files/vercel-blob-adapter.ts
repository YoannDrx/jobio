import { put } from "@vercel/blob";
import type { UploadFileAdapter } from "./upload-file";

export const fileAdapter: UploadFileAdapter = {
  uploadFile: async (params) => {
    try {
      const file = params.file;

      const blob = await put(file.name, file, {
        access: "public",
      });

      return { error: null, data: { url: blob.url } };
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
        const blob = await put(param.file.name, param.file, {
          access: "public",
        });

        return { error: null, data: { url: blob.url } };
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
