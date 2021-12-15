import { S3Client, S3ClientConfig } from "@aws-sdk/client-s3";

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
