import { S3Client } from "@aws-sdk/client-s3";
import { fromIni } from "@aws-sdk/credential-provider-ini";
import { MetadataBearer } from "@aws-sdk/types";

export function getS3Client(profile: string) {
  return new S3Client({
    credentials: fromIni({ profile }),
  });
}

function isMetadataBearer(error: unknown): error is MetadataBearer {
  return error instanceof Error && "$metadata" in error;
}

export function is404Error(error: unknown) {
  return isMetadataBearer(error) && error.$metadata.httpStatusCode === 404;
}
