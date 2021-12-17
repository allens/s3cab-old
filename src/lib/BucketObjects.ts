import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { FileInfo } from "../util/file";
import { createReadStream } from "fs";
import { listObjects } from "./s3Client";

export class BucketObjects {
  readonly prefix: string;

  constructor(
    private s3Client: S3Client,
    private bucket: string,
    prefix: string
  ) {
    this.prefix = `${prefix}/objects/`;
  }

  async *getInventory() {
    const prefixLength = this.prefix.length;
    for await (const obj of listObjects(this.s3Client, {
      Bucket: this.bucket,
      Prefix: this.prefix,
    })) {
      yield obj.Key?.slice(prefixLength);
    }
  }

  async putObject(fileInfo: FileInfo) {
    const fileStream = createReadStream(fileInfo.path);
    const key = `${this.prefix}/${fileInfo.hash}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Metadata: {
        "x-amz-meta-s3pac-path": fileInfo.path,
        "x-amz-meta-s3pac-size": fileInfo.size.toString(),
        "x-amz-meta-s3pac-mtime": fileInfo.mtime.getTime().toString(),
        "x-amz-meta-s3pac-hash": fileInfo.hash,
        "x-amz-meta-s3pac-mtime-string": fileInfo.mtime.toString(),
      },
      Body: fileStream,
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
