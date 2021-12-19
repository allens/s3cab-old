import * as prettyMilliseconds from "pretty-ms";

import { Command, flags } from "@oclif/command";
import { FileInfo, getIsNewOrModifiedFilter, walkSync } from "../util/file";
import { createS3Client, getBucketRegion } from "../lib/s3Client";
import {
  getLatestSnapshotPath,
  getNewSnapshotPath,
  snapshotRead,
  snapshotWrite,
} from "../snapshot";

import { BucketObjects } from "../lib/BucketObjects";
import { Logging } from "../util/logging";
import { uploadFiles } from "../uploader";

export default class Backup extends Command {
  static description = "describe the command here";

  static flags = {
    help: flags.help({ char: "h" }),
    force: flags.boolean({ char: "f" }),
    noupload: flags.boolean({ char: "n" }),
    profile: flags.string({ char: "p", description: "AWS profile" }),
    endpoint: flags.string({ char: "e", description: "AWS S3 endpoint" }),
  };

  static args = [{ name: "file" }];

  async run() {
    const start = Date.now();
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
    // const rootFolder = "C:\\data\\s3cab";

    const bucket = new BucketObjects(
      createS3Client({
        region: await getBucketRegion(
          createS3Client({
            profile,
            endpoint,
          }),
          bucketName
        ),
        endpoint,
        profile,
      }),
      bucketName,
      bucketPrefix
    );

    const unmodified: FileInfo[] = [];
    const added: string[] = [];

    Logging.start(`Searching "${rootFolder}"`);
    let filesToBackup = Array.from(walkSync(rootFolder));
    Logging.stop(`found ${filesToBackup.length} files`);

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

    await uploadFiles(
      bucket,
      newSnapshotPath,
      filesToBackup,
      flags.force,
      flags.noupload
    );

    const duration = prettyMilliseconds(Date.now() - start);
    this.log(duration);
  }
}
