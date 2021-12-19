import { Hash, createHash } from "crypto";
import {
  createReadStream,
  promises as fsPromises,
  readdirSync,
  statSync,
} from "fs";

import { XXHash64 } from "xxhash-addon";
import { h64 } from "xxhashjs";
import { join } from "path";

export interface FileInfo {
  path: string;
  mtime: Date;
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
      const { mtime, size } = await fsPromises.stat(fileInfo.path);
      return fileInfo.mtime !== mtime || fileInfo.size !== size;
    } catch (error) {
      console.error(error);
    }
  }
}

export function isModifiedSync(fileInfo: FileInfo) {
  if (fileInfo !== undefined) {
    try {
      const { mtime, size } = statSync(fileInfo.path);
      return fileInfo.mtime !== mtime || fileInfo.size !== size;
    } catch (error) {
      console.error(error);
    }
  }
}

export async function getFileInfo(path: string, hashAlgo: HashAlgo) {
  const { mtime, size } = await fsPromises.stat(path);
  const hash = await checksumFile(path, hashAlgo);
  return { path, hash, mtime, size };
}

export type HashAlgo = "sha256" | "xxhash" | "xxhashjs";

function getHash(algo: HashAlgo) {
  if (algo === "sha256") {
    return createHash("sha256");
  } else if (algo === "xxhash") {
    return new XXHash64() as Hash;
  } else if (algo === "xxhashjs") {
    return h64() as unknown as Hash;
  }
  throw "no hash";
}

function checksumFile(path: string, hashName: HashAlgo) {
  return new Promise<string>((resolve, reject) => {
    const hash = getHash(hashName);
    const stream = createReadStream(path);
    stream.on("error", (error) => reject(error));
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest().toString("hex")));
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
