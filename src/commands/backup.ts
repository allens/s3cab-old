import { Command, flags } from "@oclif/command";

import { T } from "../t";
import { checksumFile } from "../checksum-file";
import { cli } from "cli-ux";
import { promises as fsPromises } from "fs";
import { walk } from "../walk";

interface FileInfo {
  path: string;
  mtimeMs: number;
  size: number;
  hash?: string;
}

async function isModified(fileInfo: FileInfo) {
  if (fileInfo !== undefined) {
    try {
      const { mtimeMs, size } = await fsPromises.stat(fileInfo.path);
      return fileInfo.mtimeMs !== mtimeMs || fileInfo.size !== size;
    } catch (error) {
      console.error(error);
    }
  }
}

async function getFileInfo(path: string) {
  try {
    const { mtimeMs, size } = await fsPromises.stat(path);
    const hash = await checksumFile(path);
    return { path, hash, mtimeMs, size };
  } catch (error) {
    console.error(error);
  }
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
    const modifiedPaths: string[] = [];

    if (matchedPaths.length) {
      const newSnapshot: FileInfo[] = [];

      T.start(`Comparing`);

      for (const path of matchedPaths) {
        const fileInfo = currentSnapshot.get(path);
        if (fileInfo) {
          const modified = await isModified(fileInfo);
          if (modified) {
            modifiedPaths.push(path);
          } else {
            newSnapshot.push(fileInfo);
          }
        } else {
          this.warn(`${path} is now missing`);
        }
      }
      T.stop();

      this.log(`  modified: ${modifiedPaths.length}`);

      // Write new snapshot
      this.write(newSnapshot);
    }

    const backupPaths = modifiedPaths.concat(newPaths);

    for (const path of backupPaths) {
      cli.action.start(path);
      const fileInfo = await getFileInfo(path);
      cli.action.stop(fileInfo?.hash);

      // const objectExists = getObjectExists();
      //   fileInfo.hash = await checksumFile(path);
      //   this.log(`${fileInfo}`);
    }

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

  write(fileInfo: FileInfo[]) {
    this.log(`WROTING fileInfo ${fileInfo.length}`);
  }
}
