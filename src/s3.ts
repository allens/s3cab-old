import {
  GetBucketLocationCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { FileInfo } from "./util/file";
import { MetadataBearer } from "@aws-sdk/types";
import { createReadStream } from "fs";

function isMetadataBearer(error: unknown): error is MetadataBearer {
  return error instanceof Error && "$metadata" in error;
}

function is404Error(error: unknown) {
  return isMetadataBearer(error) && error.$metadata.httpStatusCode === 404;
}

export async function getBucketRegion(s3Client: S3Client, bucket: string) {
  const { LocationConstraint } = await s3Client.send(
    new GetBucketLocationCommand({ Bucket: bucket })
  );
  return LocationConstraint;
}

async function objectExists(
  client: S3Client,
  input: { Bucket: string; Key: string }
) {
  try {
    await client.send(new HeadObjectCommand(input));
    return true;
  } catch (error) {
    if (is404Error(error)) {
      return false;
    }
    throw error;
  }
}

export class S3Bucket {
  readonly objectsPrefix: string;

  constructor(
    private s3Client: S3Client,
    private bucket: string,
    prefix: string
  ) {
    this.objectsPrefix = `${prefix}/objects`;
  }

  private key(hash: string) {
    return `${this.objectsPrefix}/${hash}`;
  }

  async *getInventory() {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: this.objectsPrefix,
    });
    do {
      const { Contents, ContinuationToken } = await this.s3Client.send(command);
      command.input.ContinuationToken = ContinuationToken;
      if (Contents) {
        yield* Array.from(
          Contents.map((o) => o.Key)
            .filter((key): key is string => !!key)
            .map((key) => key.slice(this.objectsPrefix.length + 1))
        );
      }
    } while (command.input.ContinuationToken);
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
}
