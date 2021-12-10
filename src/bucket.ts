import {
  GetBucketLocationCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { FileInfo } from "./util/file";
import { isMetadataBearer } from "./util/aws";
import { join } from "path";

export class Bucket {
  constructor(
    private s3Client: S3Client,
    private bucket: string,
    private prefix: string
  ) {}
  async init() {
    const response = await this.s3Client.send(
      new GetBucketLocationCommand({ Bucket: this.bucket })
    );
    this.s3Client = new S3Client({ region: response.LocationConstraint });
  }

  async headObject(hash: string) {
    const key = join(this.prefix, hash);
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (isMetadataBearer(error) && error.$metadata.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  async putObject(fileInfo: FileInfo) {
    return true;
  }
}
