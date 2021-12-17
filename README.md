# s3cab

Content addressable backups to S3 with open and portable data format

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/s3cab.svg)](https://npmjs.org/package/s3cab)
[![CircleCI](https://circleci.com/gh/allens/s3cab/tree/master.svg?style=shield)](https://circleci.com/gh/allens/s3cab/tree/master)
[![Downloads/week](https://img.shields.io/npm/dw/s3cab.svg)](https://npmjs.org/package/s3cab)
[![License](https://img.shields.io/npm/l/s3cab.svg)](https://github.com/allens/s3cab/blob/master/package.json)

<!-- toc -->
* [s3cab](#s3cab)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->
```sh-session
$ npm install -g s3cab
$ s3cab COMMAND
running command...
$ s3cab (-v|--version|version)
s3cab/0.0.0 win32-x64 node-v14.18.1
$ s3cab --help [COMMAND]
USAGE
  $ s3cab COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`s3cab backup [FILE]`](#s3cab-backup-file)
* [`s3cab hello [FILE]`](#s3cab-hello-file)
* [`s3cab help [COMMAND]`](#s3cab-help-command)

## `s3cab backup [FILE]`

describe the command here

```
USAGE
  $ s3cab backup [FILE]

OPTIONS
  -e, --endpoint=endpoint  AWS S3 endpoint
  -f, --force
  -h, --help               show CLI help
  -n, --name=name          name to print
  -p, --profile=profile    AWS profile
```

_See code: [src/commands/backup.ts](https://github.com/allens/s3cab/blob/v0.0.0/src/commands/backup.ts)_

## `s3cab hello [FILE]`

describe the command here

```
USAGE
  $ s3cab hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ s3cab hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/allens/s3cab/blob/v0.0.0/src/commands/hello.ts)_

## `s3cab help [COMMAND]`

display help for s3cab

```
USAGE
  $ s3cab help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.7/src/commands/help.ts)_
<!-- commandsstop -->
