import { FileInfo } from "../util/file";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { createReadStream } from "fs";
import { listObjects } from "./s3Client";

const getMetadata = (fileInfo: FileInfo) => ({
  "x-amz-meta-s3pac-path": fileInfo.path,
  "x-amz-meta-s3pac-size": fileInfo.size.toString(),
  "x-amz-meta-s3pac-mtime": fileInfo.mtime.getTime().toString(),
  "x-amz-meta-s3pac-hash": fileInfo.hash,
  "x-amz-meta-s3pac-mtime-string": fileInfo.mtime.toString(),
});

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
    const start = this.prefix.length + 1;
    for await (const obj of listObjects(this.s3Client, {
      Bucket: this.bucket,
      Prefix: this.prefix,
    })) {
      const { Key, Size, LastModified } = obj;
      yield { Key, Size, LastModified };
    }
  }

  async upload(fileInfo: FileInfo) {
    const fileStream = createReadStream(fileInfo.path);
    const key = `${this.prefix}/${fileInfo.hash}`;

    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Metadata: getMetadata(fileInfo),
        Body: fileStream,
      },
    });

    return upload.done();
  }
}
