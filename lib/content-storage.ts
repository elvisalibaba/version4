import "server-only";

import path from "path";
import { mkdir, readFile, writeFile } from "fs/promises";

function resolveFilePath(relativePath: string) {
  return path.join(process.cwd(), relativePath);
}

export async function readJsonFile<T>(relativePath: string, fallbackValue: T): Promise<T> {
  const filePath = resolveFilePath(relativePath);

  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    const filesystemError = error as NodeJS.ErrnoException;

    if (filesystemError.code === "ENOENT") {
      await writeJsonFile(relativePath, fallbackValue);
      return fallbackValue;
    }

    throw error;
  }
}

export async function writeJsonFile<T>(relativePath: string, value: T) {
  const filePath = resolveFilePath(relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
