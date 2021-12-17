import {
  GetBucketLocationCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  S3Client,
  S3ClientConfig,
} from "@aws-sdk/client-s3";

import { MetadataBearer } from "@aws-sdk/types";
import { fromIni } from "@aws-sdk/credential-provider-ini";

interface CreateS3ClientConfig {
  readonly profile?: string;
  readonly endpoint?: string;
  readonly region?: string;
  readonly credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export function createS3Client(createConfig: CreateS3ClientConfig) {
  const { profile, credentials, endpoint, region } = createConfig;
  const configuration: S3ClientConfig = {
    credentials,
    endpoint,
    region,
  };
  if (profile) {
    configuration.credentials = fromIni({ profile });
  }

  const client = new S3Client(configuration);

  return client;
}

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

export async function* listObjects(
  s3Client: S3Client,
  input: ListObjectsV2CommandInput
) {
  do {
    const response = await s3Client.send(new ListObjectsV2Command(input));
    yield* Array.from(response.Contents || []);
    input.ContinuationToken = response.ContinuationToken;
  } while (input.ContinuationToken);
}
