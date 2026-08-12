const SUPPORTED_IMAGE_MIME_TYPES = [
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const isSupportedImageMimeType = (
  value: string,
): value is (typeof SUPPORTED_IMAGE_MIME_TYPES)[number] =>
  SUPPORTED_IMAGE_MIME_TYPES.includes(
    value as (typeof SUPPORTED_IMAGE_MIME_TYPES)[number],
  );

const readBlobBytes = async (blob: Blob) => {
  if (typeof blob.arrayBuffer === "function") return blob.arrayBuffer();
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () =>
      reject(reader.error ?? new Error("FILE_READ_FAILED"));
    reader.readAsArrayBuffer(blob);
  });
};

export const hasValidImageSignature = async (file: File) => {
  if (!isSupportedImageMimeType(file.type)) return false;
  const bytes = new Uint8Array(await readBlobBytes(file.slice(0, 12)));
  if (file.type === "image/png") {
    return [137, 80, 78, 71, 13, 10, 26, 10].every(
      (value, index) => bytes[index] === value,
    );
  }
  if (file.type === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (file.type === "image/gif") {
    const header = new TextDecoder().decode(bytes.slice(0, 6));
    return header === "GIF87a" || header === "GIF89a";
  }
  return (
    new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
    new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
  );
};

export const extensionForImageMimeType = (mimeType: string) => {
  const extensions: Record<string, string> = {
    "image/gif": "gif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return extensions[mimeType] ?? "bin";
};
