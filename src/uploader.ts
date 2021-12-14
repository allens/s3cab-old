import prettyBytes = require("pretty-bytes");

import { FileInfo, getFileInfo } from "./util/file";

import { Bucket } from "./s3";
import { T } from "./util/logging";
import { existsSync } from "fs";
import { snapshotWrite } from "./snapshot";

async function getInventory(bucket: Bucket) {
  const inventory = new Set<string>();
  const exists = existsSync("inventory.csv");
  if (!exists) {
    for await (const key of bucket.getInventory()) {
      inventory.add(key);
    }
  }
  return inventory;
}

export class Uploader {
  constructor(private snapshot: string, private bucket: Bucket) {}

  async uploadFiles(backupPaths: string[]) {
    const inventory = await getInventory(this.bucket);

    for (const path of backupPaths) {
      try {
        T.start(`hash: ${path}`);
        const fileInfo = await getFileInfo(path);
        T.stop();

        const objectExists = inventory.has(fileInfo.hash);

        if (objectExists) {
          console.log(
            `    ignore: ${fileInfo.hash} (already exists in bucket)`
          );
        } else {
          await this.upload(fileInfo);
        }

        await snapshotWrite(this.snapshot, [fileInfo]);
      } catch (error) {
        console.error(`${error}`);
      }
    }
  }

  private async objectExists(fileInfo: FileInfo) {
    const response = await this.bucket.headObject(fileInfo.hash);
    if (response) {
      const { ContentLength } = response;
      if (ContentLength === fileInfo.size) {
        return true;
      } else {
        console.warn(
          `    WARNING: Size mismatch - ContentLength is ${ContentLength} but size = ${fileInfo.size} `
        );
      }
    }
    return false;
  }

  private async upload(fileInfo: FileInfo) {
    try {
      T.start(`    upload: ${fileInfo.hash} (${prettyBytes(fileInfo.size)})`);
      await this.bucket.putObject(fileInfo);
      T.stop();
    } catch (error) {
      T.stop(`${error}`);
    }
  }
}
