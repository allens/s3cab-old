import { Bucket } from "./bucket";
import { snapshotWrite } from "./snapshot";
import { FileInfo, getFileInfo } from "./util/file";
import { T } from "./util/logging";

export class Uploader {
  constructor(private snapshot: string, private bucket: Bucket) {}

  async uploadFiles(backupPaths: string[]) {
    for (const path of backupPaths) {
      try {
        T.start(path);
        const fileInfo = await getFileInfo(path);
        T.stop(fileInfo.hash);
        const uploaded = await this.upload(fileInfo);
        if (uploaded) {
          await snapshotWrite(this.snapshot, [fileInfo]);
        }
      } catch (error) {
        T.stop(`${error}`);
      }
    }
  }

  private async upload(fileInfo: FileInfo) {
    const { hash } = fileInfo;
    try {
      const objectExists = await this.bucket.headObject(hash);

      if (!objectExists) {
        T.start("    uploading");
        await this.bucket.putObject(fileInfo);
        T.stop();
      }
      return true;
    } catch (error) {
      T.stop(`${error}`);
    }
  }
}
