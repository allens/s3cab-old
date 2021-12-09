export interface FileInfo {
  path: string;
  mtimeMs: number;
  size: number;
  hash?: string;
}
