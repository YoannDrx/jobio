/* eslint-disable no-await-in-loop, no-console -- generated files are patched and verified sequentially */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const patches = [
  {
    file: "src/generated/prisma/index.js",
    source: "path.join(process.cwd(), alternativePath)",
    replacement:
      "path.join(/* turbopackIgnore: true */ process.cwd(), alternativePath)",
  },
  {
    file: "src/generated/prisma/runtime/library.js",
    source: "return Fi.existsSync(r)?r:null}",
    replacement: "return Fi.existsSync(/* turbopackIgnore: true */r)?r:null}",
  },
] as const;

const main = async () => {
  for (const patch of patches) {
    const path = resolve(patch.file);
    const content = await readFile(path, "utf8");
    if (content.includes(patch.replacement)) continue;
    if (!content.includes(patch.source)) {
      throw new Error(
        `Prisma generated output changed; Turbopack patch not found in ${patch.file}`,
      );
    }
    await writeFile(path, content.replace(patch.source, patch.replacement));
    console.log(`[OK] Patched ${patch.file}`);
  }
};

void main();
