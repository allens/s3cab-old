import { FileInfo } from "./util/file";

export async function getLatestSnapshotPath() {
  return "theLatestSnapshotPath";
}

export async function getNewSnapshotPath() {
  return "theNewSnapshotPath";
}
export async function snapshotRead(path: string) {
  return new Map<string, FileInfo>();
}

export async function snapshotWrite(path: string, fileInfo: FileInfo[]) {
  //   console.log(`Wrote ${fileInfo.length} record to ${path}`);
}
