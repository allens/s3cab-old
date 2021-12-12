import prettyBytes = require("pretty-bytes");

import { Bucket } from "./bucket";
import { snapshotWrite } from "./snapshot";
import { FileInfo, getFileInfo } from "./util/file";
import { T } from "./util/logging";

export class Uploader {
  constructor(private snapshot: string, private bucket: Bucket) {}

  async uploadFiles(backupPaths: string[]) {
    for (const path of backupPaths) {
      try {
        T.start(`Calculating hash for ${path}`);
        const fileInfo = await getFileInfo(path);

        const objectExists = await this.objectExists(fileInfo);
        if (objectExists) {
          T.stop(`${fileInfo.hash} (already uploaded)`);
        } else {
          T.stop(`${fileInfo.hash}`);
          await this.upload(fileInfo);
        }

        await snapshotWrite(this.snapshot, [fileInfo]);
      } catch (error) {
        T.stop(`${error}`);
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
          `Size mismatch: ContentLength = ${ContentLength}, size = ${fileInfo.size} `
        );
      }
    }
    return false;
  }

  private async upload(fileInfo: FileInfo) {
    try {
      T.start(`    Uploading ${prettyBytes(fileInfo.size)}`);
      await this.bucket.putObject(fileInfo);
      T.stop();
    } catch (error) {
      T.stop(`${error}`);
    }
  }
}
