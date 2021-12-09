import { Stats, promises as fsPromises, readdirSync, statSync } from "fs";

import { join } from "path";

export function getFilesForBackup(root: string) {
  // TODO read include
  // TODO read exclude
  return [...walkPathSync(root)];
}

export function getFileStatsForBackup(root: string) {
  return [...walkStatsSync(root)];
  // return getFilesForBackup(root).map((path) => {
  //   const { mtime, size } = statSync(path);
  //   return [path, { mtime, size }];
  // });
}

export function getFileStatsForBackup2(root: string) {
  return [...walkStatsSync2(root)];
  // return getFilesForBackup(root).map((path) => {
  //   const { mtime, size } = statSync(path);
  //   return [path, { mtime, size }];
  // });
}

export function* walkPathSync(dir = "."): Generator<string> {
  try {
    const files = readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const path = join(dir, file.name);
      if (file.isDirectory()) {
        yield* walkPathSync(path);
      } else if (file.isFile()) {
        yield path;
      }
    }
  } catch (error) {
    console.error(`walkPathSync ${dir} ${error}`);
  }
}

export function* walkStatsSync(dir = "."): Generator<[string, Stats]> {
  try {
    const files = readdirSync(dir);
    for (const file of files) {
      const path = join(dir, file);
      const stats = statSync(path);
      if (stats.isDirectory()) {
        yield* walkStatsSync(path);
      } else if (stats.isFile()) {
        yield [path, stats];
      }
    }
  } catch (error) {
    console.error(`walkPathSync ${dir} ${error}`);
  }
}

export async function* walkStats(dir: string) {
  try {
    const files = await fsPromises.readdir(dir, { withFileTypes: true });
    for (const file of files) {
      const path = join(dir, file.name);
      if (file.isDirectory()) {
        yield* walkStatsSync2(path);
      } else if (file.isFile()) {
        yield [path, await fsPromises.stat(path)];
      }
    }
  } catch (error) {
    console.error(`walkPathSync ${dir} ${error}`);
  }
}

export function* walkStatsSync2(dir = "."): Generator<[string, Stats]> {
  try {
    const files = readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const path = join(dir, file.name);
      if (file.isDirectory()) {
        yield* walkStatsSync2(path);
      } else if (file.isFile()) {
        yield [path, statSync(path)];
      }
    }
  } catch (error) {
    console.error(`walkPathSync ${dir} ${error}`);
  }
}

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
