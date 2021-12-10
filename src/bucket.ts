import {
  GetBucketLocationCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { join } from "path";
import { isMetadataBearer } from "./util/aws";
import { FileInfo } from "./util/file";

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
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: join(this.prefix, hash),
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
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: join(this.prefix, fileInfo.hash),
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
