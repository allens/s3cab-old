import { Command, flags } from "@oclif/command";

import { T } from "../t";
import { promises as fsPromises } from "fs";
import { walk } from "../walk";

interface FileInfo {
  path: string;
  mtimeMs: number;
  size: number;
  hash?: string;
}
export default class Backup extends Command {
  static description = "describe the command here";

  static flags = {
    help: flags.help({ char: "h" }),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({ char: "n", description: "name to print" }),
    // flag with no value (-f, --force)
    force: flags.boolean({ char: "f" }),
  };

  static args = [{ name: "file" }];

  async run() {
    const { args, flags } = this.parse(Backup);

    // Read config
    const rootFolder = "C:\\Program Files";
    // const rootFolder = "C:\\Users\\shielsa\\OneDrive - Innovyze, INC";
    // const rootFolder = "C:\\Windows";
    const bucket = "s3cab-testing";
    const prefix = "foo";

    const currentSnapshot = new Map<string, FileInfo>();

    // First pass: Look for files in previous backup and sort into found and additional
    T.start(`Searching "${rootFolder}"`);

    const matchedPaths: string[] = [];
    const newPaths: string[] = [];
    const missingPaths = new Set(currentSnapshot.keys());

    for await (const path of walk(rootFolder)) {
      if (missingPaths.delete(path)) {
        matchedPaths.push(path);
      } else {
        newPaths.push(path);
      }
    }
    T.stop();

    this.log("Compared with previous snapshot:");
    this.log(`  new:      ${newPaths.length}`);
    this.log(`  missing:  ${missingPaths.size}`);
    this.log(`  matched:  ${matchedPaths.length}`);

    // Second pass: Look for modified files
    if (matchedPaths.length) {
      T.start(`Comparing`);

      const modified: string[] = [];
      for (const path of matchedPaths) {
        try {
          const stat = await fsPromises.stat(path);
          const current = currentSnapshot.get(path);
          if (current) {
            if (
              current.size !== stat.size ||
              current.mtimeMs !== stat.mtimeMs
            ) {
              modified.push(path);
            }
          } else {
            this.error("MISSING AGAIN");
          }
        } catch (error) {
          this.error(`${error}`);
        }
      }
      T.stop();

      this.log(`  modified: ${modified.length}`);
    }

    const newSnapshot = new Map<string, FileInfo>();
    // const modified = new Map<string, FileInfo>();

    // for await (const path of walk(rootFolder)) {
    //   const stat = await fsPromises.stat(path);
    //   const fileInfo = currentSnapshot.get(path);
    //   if (fileInfo) {
    //     deleted.delete(path);
    //     if (stat.mtimeMs === fileInfo.mtimeMs && stat.size === fileInfo.size) {
    //       newSnapshot.set(path, fileInfo);
    //     } else {
    //       modified.set(path, fileInfo);
    //     }
    //   } else {
    //     const { mtimeMs, size } = stat;
    //     added.set(path, { path, mtimeMs, size });
    //   }
    // }

    // this.log(
    //   `added ${added.size}, modified ${modified.size}, deleted ${deleted.size} (took ${T.sec})`
    // );

    // const process = new Map([...modified, ...added]);

    // for (const [path, fileInfo] of process) {
    //   fileInfo.hash = await checksumFile(path);
    //   this.log(`${fileInfo}`);
    // }
    // const s3 = new S3Client({});

    // const listBuckets = new ListBucketsCommand({});

    // const response = await s3.send(listBuckets);

    // this.log("list buckets", response);
  }
}
