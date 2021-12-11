import { createHash } from "crypto";
import {
  createReadStream,
  promises as fsPromises,
  readdirSync,
  statSync,
} from "fs";
import { join } from "path";

export interface FileInfo {
  path: string;
  mtimeMs: number;
  size: number;
  hash: string;
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

export function* walkSync(dir: string): Generator<string> {
  try {
    const files = readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const path = join(dir, file.name);
      if (file.isDirectory()) {
        yield* walkSync(path);
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

export function isModifiedSync(fileInfo: FileInfo) {
  if (fileInfo !== undefined) {
    try {
      const { mtimeMs, size } = statSync(fileInfo.path);
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

export function getIsNewOrModifiedFilter(
  snapshot: Map<string, FileInfo>,
  added?: string[],
  unmodified?: FileInfo[]
) {
  return function (path: string) {
    let modified = true;
    const fileInfo = snapshot.get(path);
    if (fileInfo) {
      modified = isModifiedSync(fileInfo) !== false;
      if (!modified) unmodified?.push(fileInfo);
    } else {
      added?.push(path);
    }
    return modified;
  };
}
