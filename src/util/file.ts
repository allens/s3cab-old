import { createReadStream, promises as fsPromises } from "fs";

import { createHash } from "crypto";
import { join } from "path";

export interface FileInfo {
  path: string;
  mtimeMs: number;
  size: number;
  hash?: string;
}

export type FileInfoMap = Map<string, FileInfo>;

export async function* walk(dir: string): AsyncGenerator<string> {
  try {
    const files = await fsPromises.readdir(dir, { withFileTypes: true });
    for (const file of files) {
      const path = join(dir, file.name);
      if (file.isDirectory()) {
        yield* walk(path);
      } else if (file.isFile()) {
        yield path;
      }
    }
  } catch (error) {
    console.error(`${error}`);
  }
}

export async function isModified(fileInfo: FileInfo) {
  if (fileInfo !== undefined) {
    try {
      const { mtimeMs, size } = await fsPromises.stat(fileInfo.path);
      return fileInfo.mtimeMs !== mtimeMs || fileInfo.size !== size;
    } catch (error) {
      console.error(error);
    }
  }
}

export async function getFileInfo(path: string) {
  const { mtimeMs, size } = await fsPromises.stat(path);
  const hash = await checksumFile(path);
  return { path, hash, mtimeMs, size };
}

function checksumFile(path: string) {
  return new Promise<string>((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(path);
    stream.on("error", (error) => reject(error));
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}
