/* eslint-disable no-await-in-loop, no-console -- trace files are inspected sequentially to cap memory */
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

const MAX_TRACE_BYTES = 75 * 1024 * 1024;
const MAX_TRACE_FILES = 1_600;
const FORBIDDEN_DIRECTORIES = [
  ".github",
  "__tests__",
  "docs",
  "e2e",
  "playwright-report",
  "test-results",
].map((path) => `${resolve(path).replaceAll("\\", "/")}/`);
const FORBIDDEN_FILES = new Set(
  ["pnpm-lock.yaml", "tsconfig.tsbuildinfo"].map((path) =>
    resolve(path).replaceAll("\\", "/"),
  ),
);

const walk = async (root: string): Promise<string[]> => {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(root, entry.name);
      return entry.isDirectory() ? walk(path) : [path];
    }),
  );
  return nested.flat();
};

const main = async () => {
  const traceFiles = (await walk(resolve(".next/server/app"))).filter((path) =>
    path.endsWith(".nft.json"),
  );
  if (traceFiles.length === 0) throw new Error("No Next.js trace files found");

  const failures: string[] = [];
  let largest = { path: "", bytes: 0, files: 0 };

  for (const tracePath of traceFiles) {
    const trace = JSON.parse(await readFile(tracePath, "utf8")) as {
      files?: string[];
    };
    const files = trace.files ?? [];
    let bytes = 0;
    for (const item of files) {
      const absolute = resolve(dirname(tracePath), item);
      const normalized = absolute.replaceAll("\\", "/");
      if (
        FORBIDDEN_DIRECTORIES.some((prefix) => normalized.startsWith(prefix)) ||
        FORBIDDEN_FILES.has(normalized)
      ) {
        failures.push(`${relative(process.cwd(), tracePath)} traces ${item}`);
      }
      try {
        bytes += (await stat(absolute)).size;
      } catch {
        // Optional files can be absent on the current platform.
      }
    }
    if (bytes > largest.bytes) {
      largest = { path: tracePath, bytes, files: files.length };
    }
    if (bytes > MAX_TRACE_BYTES || files.length > MAX_TRACE_FILES) {
      failures.push(
        `${relative(process.cwd(), tracePath)}: ${(bytes / 1024 / 1024).toFixed(1)} MiB, ${files.length} files`,
      );
    }
  }

  if (failures.length > 0) {
    console.error(failures.slice(0, 30).join("\n"));
    throw new Error(`${failures.length} deployment trace violation(s)`);
  }

  console.log(
    `[OK] ${traceFiles.length} traces; largest=${(largest.bytes / 1024 / 1024).toFixed(1)} MiB/${largest.files} files (${relative(process.cwd(), largest.path)})`,
  );
};

void main();
