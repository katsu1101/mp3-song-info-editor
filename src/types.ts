
export type Mp3Entry = {
  path: string;        // 表示用（サブフォルダ含む）
  name: string;
  size: number;
  lastModified: number;

  fileHandle: FileSystemFileHandle;
};
