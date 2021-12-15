import { Bucket, S3Bucket, getBucketRegion } from "../s3";
import { Command, flags } from "@oclif/command";
import { FileInfo, getIsNewOrModifiedFilter, walkSync } from "../util/file";
import {
  getLatestSnapshotPath,
  getNewSnapshotPath,
  snapshotRead,
  snapshotWrite,
} from "../snapshot";

import { T } from "../util/logging";
import { createS3Client } from "../lib/s3Client";
import { uploadFiles } from "../uploader";

export default class Backup extends Command {
  static description = "describe the command here";

  static flags = {
    help: flags.help({ char: "h" }),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({ char: "n", description: "name to print" }),
    // flag with no value (-f, --force)
    force: flags.boolean({ char: "f" }),
    profile: flags.string({ char: "p", description: "AWS profile" }),
    endpoint: flags.string({ char: "e", description: "AWS S3 endpoint" }),
  };

  static args = [{ name: "file" }];

  private _bucket: Bucket | undefined;

  async run() {
    const { args, flags } = this.parse(Backup);

    const { profile, endpoint } = flags;
    let accessKeyId: string;
    let secretAccessKey: string;

    const bucketName = "s3cab-testing";
    const bucketPrefix = "testing-prefix";

    const rootFolder = "test/fixtures/my-precious-data";
    // const rootFolder = "C:\\Program Files";
    // const rootFolder = "C:\\Users\\shielsa\\OneDrive - Innovyze, INC";
    // const rootFolder = "C:\\Windows";
    // const rootFolder = "C:\\Users\\shielsa\\tmp";

    const s3Client = createS3Client({
      profile,
      endpoint,
    });

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

    const bucket = new S3Bucket(
      createS3Client({
        region: await getBucketRegion(s3Client, bucketName),
        endpoint,
        profile,
      }),
      bucketName,
      bucketPrefix
    );

    await uploadFiles(bucket, newSnapshotPath, filesToBackup, flags.force);
  }
}
