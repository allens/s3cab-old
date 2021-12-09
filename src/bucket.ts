import {
  HeadObjectCommand,
  ListBucketsCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { FileInfo } from "./types";
import { join } from "path";

// process.env.AWS_PROFILE = "thehousecat";
console.log("process.env.AWS_PROFILE", process.env.AWS_PROFILE);
const s3Client = new S3Client({
  region: "eu-west-1",
  //   credentials: fromIni({ profile: "thehousecat" }),
});

s3Client
  .send(new ListBucketsCommand({}))
  .then((response) => {
    console.log("list buckets", response);
  })
  .catch((error) => {
    console.error(error);
  });

export class Bucket {
  constructor(private bucket: string, private prefix: string) {}

  async headObject(hash: string) {
    const key = join(this.prefix, hash);
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: "foo",
    });

    try {
      const response = await s3Client.send(command);
      console.log(response);
      const { httpStatusCode } = response.$metadata;
      return true;
    } catch (error) {
      console.log(error);
    }
    return false;
    // if (httpStatusCode === 200) {
    //   return true;
    // } else if (httpStatusCode === 404) {
    //   return false;
    // } else {
    //   throw new Error();
    // }
  }

  async putObject(fileInfo: FileInfo) {
    return true;
  }
}
