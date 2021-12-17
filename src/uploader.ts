import prettyBytes = require("pretty-bytes");

import { FileInfo, getFileInfo } from "./util/file";

import { BucketObjects } from "./lib/BucketObjects";
import { T } from "./util/logging";
import { cli } from "cli-ux";
import { existsSync } from "fs";
import { snapshotWrite } from "./snapshot";

async function getInventory(bucket: BucketObjects) {
  const inventory = new Set<string>();
  const exists = existsSync("inventory.csv");
  if (!exists) {
    for await (const key of bucket.getInventory()) {
      key && inventory.add(key);
    }
  }
  return inventory;
}

export async function uploadFiles(
  bucket: BucketObjects,
  snapshot: string,
  backupPaths: string[],
  force?: boolean
) {
  const inventory = await getInventory(bucket);

  for (const path of backupPaths) {
    try {
      cli.action.start(`hash: ${path}`);
      const fileInfo = await getFileInfo(path);

      const has = inventory.has(fileInfo.hash);

      cli.action.stop(has ? "already exists" : "missing");

      if (!has || force) {
        await upload(bucket, fileInfo);
      }

      await snapshotWrite(snapshot, [fileInfo]);
    } catch (error) {
      console.error(`${error}`);
    }
  }
}

export async function upload(bucket: BucketObjects, fileInfo: FileInfo) {
  try {
    T.start(`    upload: ${fileInfo.hash} (${prettyBytes(fileInfo.size)})`);
    await bucket.upload(fileInfo);
    T.stop();
  } catch (error) {
    T.stop(`${error}`);
  }
}
