import { MetadataBearer } from "@aws-sdk/types";
import { S3Client } from "@aws-sdk/client-s3";
import { fromIni } from "@aws-sdk/credential-provider-ini";

export function getS3Client(profile: string) {
  return new S3Client({
    credentials: fromIni({ profile }),
  });
}

export function isMetadataBearer(error: unknown): error is MetadataBearer {
  return error instanceof Error && "$metadata" in error;
}
