import { Command, flags } from "@oclif/command";
import { Bucket } from "../bucket";
import {
  getLatestSnapshotPath,
  getNewSnapshotPath,
  snapshotRead,
  snapshotWrite,
} from "../snapshot";
import { Uploader } from "../uploader";
import { getS3Client } from "../util/aws";
import {
  FileInfo,
  getFileInfo,
  getIsNewOrModifiedFilter,
  isModified,
  walk,
  walkSync,
} from "../util/file";
import { T } from "../util/logging";

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

  private _bucket: Bucket | undefined;
  private readonly currentSnapshot = new Map<string, FileInfo>();

  async run() {
    const { args, flags } = this.parse(Backup);

    const rootFolder = "test/fixtures/my-precious-data";
    // const rootFolder = "C:\\Program Files";
    // const rootFolder = "C:\\Users\\shielsa\\OneDrive - Innovyze, INC";
    // const rootFolder = "C:\\Windows";

    const unmodified: FileInfo[] = [];
    const added: string[] = [];

    T.start(`Searching "${rootFolder}"`);
    let filesToBackup = Array.from(walkSync(rootFolder));
    T.stop(`found ${filesToBackup.length} files`);

    const latestSnapshotPath = await getLatestSnapshotPath();
    const latestSnapshot = await snapshotRead(latestSnapshotPath);

    const deleted = filesToBackup.filter((file) => latestSnapshot.has(file));
    filesToBackup = filesToBackup.filter(
      getIsNewOrModifiedFilter(latestSnapshot, added, unmodified)
    );

    this.log(`Compared with previous snapshot ${latestSnapshotPath}`);
    this.log(`  ${deleted.length} files have been deleted`);
    this.log(`  ${unmodified.length} files are unchanged`);

    const newSnapshotPath = await getNewSnapshotPath();

    const modifiedCount = filesToBackup.length - added.length;
    this.log(`Backing up to new snapshot ${newSnapshotPath}`);
    this.log(`  ${added.length} new files`);
    this.log(`  ${modifiedCount} modified files`);

    await snapshotWrite(newSnapshotPath, unmodified);

    const uploader = new Uploader(newSnapshotPath, await this.getBucket());

    await uploader.uploadFiles(filesToBackup);

    // const { matchedPaths, newPaths, missingPaths } = await this.findFiles(
    //   rootFolder
    // );
    // this.log("Compared with previous snapshot:");
    // this.log(`  new:      ${newPaths.length}`);
    // this.log(`  missing:  ${missingPaths.size}`);
    // this.log(`  matched:  ${matchedPaths.length}`);

    // const { modifiedPaths, unModified } = await this.findModified(matchedPaths);
    // this.log(`  modified: ${modifiedPaths.length}`);

    // await this.appendSnapshot(unModified);

    // await this.uploadFiles(modifiedPaths.concat(newPaths));
  }

  private async appendSnapshot(fileInfo: FileInfo[]) {
    this.log(`WROTING fileInfo ${fileInfo.length}`);
  }

  private async findFiles(rootFolder: string) {
    T.start(`Searching "${rootFolder}"`);

    const missingPaths = new Set(this.currentSnapshot.keys());
    const matchedPaths: string[] = [];
    const newPaths: string[] = [];

    for await (const path of walk(rootFolder)) {
      if (missingPaths.delete(path)) {
        matchedPaths.push(path);
      } else {
        newPaths.push(path);
      }
    }
    T.stop();

    return { newPaths, missingPaths, matchedPaths };
  }

  private async findModified(matchedPaths: string[]) {
    const modifiedPaths: string[] = [];
    const unModified: FileInfo[] = [];

    if (matchedPaths.length) {
      T.start(`Comparing`);

      for (const path of matchedPaths) {
        const fileInfo = this.currentSnapshot.get(path);
        if (fileInfo) {
          const modified = await isModified(fileInfo);
          if (modified) {
            modifiedPaths.push(path);
          } else {
            unModified.push(fileInfo);
          }
        } else {
          this.warn(`${path} is now missing`);
        }
      }
      T.stop();
    }
    return { unModified, modifiedPaths };
  }

  private async uploadFiles(backupPaths: string[]) {
    for (const path of backupPaths) {
      try {
        const fileInfo = await getFileInfo(path);
        const uploaded = await this.upload(fileInfo);
        if (uploaded) {
          await this.appendSnapshot([fileInfo]);
        }
      } catch (error) {
        this.error(`${error}`);
      }
    }
  }

  private async upload(fileInfo: FileInfo) {
    T.start(`${fileInfo.hash}: ${fileInfo.path}`);
    try {
      const bucket = await this.getBucket();

      const objectExists = await bucket.headObject(fileInfo.hash);

      if (!objectExists) {
        await bucket.putObject(fileInfo);
      }
      T.stop();
      return true;
    } catch (error) {
      T.stop(`${error}`);
    }
  }

  private async getBucket() {
    if (!this._bucket) {
      const s3Client = getS3Client("thehousecat");
      const bucketName = "s3cab-testing";
      const prefix = "foo";
      this._bucket = new Bucket(s3Client, bucketName, prefix);
      await this._bucket.init();
    }
    return this._bucket;
  }
}
