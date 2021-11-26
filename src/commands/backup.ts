import { Command, flags } from "@oclif/command";
import { ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";

export default class Backup extends Command {
  static description = "describe the command here";

  static flags = {
    help: flags.help({ char: "h" }),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({ char: "n", description: "name to print" }),
    // flag with no value (-f, --force)
    force: flags.boolean({ char: "f" }),
  };

  static args = [{ name: "file" }];

  async run() {
    const { args, flags } = this.parse(Backup);

    const name = flags.name ?? "world";
    this.log(`hello ${name} from C:\\src\\s3cab\\src\\commands\\backup.ts`);
    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`);
    }

    const s3 = new S3Client({});

    const listBuckets = new ListBucketsCommand({});

    const response = await s3.send(listBuckets);

    this.log("list buckets", response);
  }
}
