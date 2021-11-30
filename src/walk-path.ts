import { Stats, readdirSync, statSync } from "fs";

import { join } from "path";

export function* walkPathSync(dir: string): Generator<string> {
  for (const file of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, file.name);
    if (file.isDirectory()) {
      yield* walkPathSync(path);
    } else if (file.isFile()) {
      yield path;
    }
  }
}

export function* walkStatsSync(dir: string): Generator<[string, Stats]> {
  for (const file of readdirSync(dir)) {
    const path = join(dir, file);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      yield* walkStatsSync(path);
    } else if (stats.isFile()) {
      yield [path, stats];
    }
  }
}
