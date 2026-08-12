type UploadFileParams = {
  file: File;
  path: string;
};

export type StoredFileData = {
  url: string;
  pathname: string;
  provider: "LOCAL" | "VERCEL_BLOB";
};

export type UploadFileAdapter = {
  uploadFile: (params: UploadFileParams) => Promise<
    | {
        error: null;
        data: StoredFileData;
      }
    | {
        error: Error;
        data: null;
      }
  >;
  uploadFiles: (params: UploadFileParams[]) => Promise<
    {
      error: Error | null;
      data: StoredFileData | null;
    }[]
  >;
};
