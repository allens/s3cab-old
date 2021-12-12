import {
  GetBucketLocationCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { FileInfo } from "./util/file";
import { MetadataBearer } from "@aws-sdk/types";
import { createReadStream } from "fs";
import { fromIni } from "@aws-sdk/credential-provider-ini";

function isMetadataBearer(error: unknown): error is MetadataBearer {
  return error instanceof Error && "$metadata" in error;
}

function is404Error(error: unknown) {
  return isMetadataBearer(error) && error.$metadata.httpStatusCode === 404;
}

async function getBucketRegion(s3Client: S3Client, bucket: string) {
  const { LocationConstraint } = await s3Client.send(
    new GetBucketLocationCommand({ Bucket: bucket })
  );
  return LocationConstraint;
}

export class Bucket {
  private s3Client = new S3Client({});

  constructor(private bucket: string, private prefix: string) {}

  async init(profile?: string) {
    let { credentials } = this.s3Client.config;
    if (profile) {
      credentials = fromIni({ profile });
      this.s3Client = new S3Client({ credentials });
    }

    const region = await getBucketRegion(this.s3Client, this.bucket);

    if (region !== this.s3Client.config.region) {
      this.s3Client = new S3Client({ credentials, region });
    }
  }

  async headObject(hash: string) {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: this.key(hash),
    });

    try {
      const response = await this.s3Client.send(command);
      return response;
    } catch (error) {
      if (!is404Error(error)) {
        throw error;
      }
    }
  }

  async putObject(fileInfo: FileInfo) {
    const fileStream = createReadStream(fileInfo.path);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: this.key(fileInfo.hash),
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

  private key(hash: string) {
    return `${this.prefix}/objects/${hash}`;
  }
}
