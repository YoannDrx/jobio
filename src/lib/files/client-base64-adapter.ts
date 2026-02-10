/**
 * CLIENT-SIDE ONLY File Adapter - Base64 Conversion
 *
 * WARNING: This adapter uses FileReader, a browser-only Web API.
 * DO NOT import or use this in server-side code (server actions, API routes, etc.)
 *
 * This adapter converts files to base64 data URLs for client-side preview/testing.
 * For production file uploads in server actions, use vercel-blob-adapter.ts instead.
 */
import type { UploadFileAdapter } from "./upload-file";

export const fileAdapter: UploadFileAdapter = {
  uploadFile: async (params) => {
    const file = params.file;
    const reader = new FileReader();

    return new Promise((resolve) => {
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve({ error: null, data: { url: base64String } });
      };

      reader.onerror = () => {
        resolve({
          error: new Error("Failed to convert file to base64"),
          data: null,
        });
      };

      reader.readAsDataURL(file);
    });
  },
  uploadFiles: async (params) => {
    const promises = params.map(async (param) => {
      return new Promise<{ error: Error | null; data: { url: string } | null }>(
        (resolve) => {
          const reader = new FileReader();

          reader.onloadend = () => {
            const base64String = reader.result as string;
            resolve({ error: null, data: { url: base64String } });
          };

          reader.onerror = () => {
            resolve({
              error: new Error("Failed to convert file to base64"),
              data: null,
            });
          };

          reader.readAsDataURL(param.file);
        },
      );
    });

    return Promise.all(promises);
  },
};
