// src/types/file-system-access.d.ts

/**
 * ファイルシステムへのアクセス権限モードを表します。
 * オプションには、読み取り専用アクセス用の「read」と、読み書きアクセス用の「readwrite」が含まれます。
 */
declare global {
  type FileSystemPermissionMode = "read" | "readwrite";

  interface FileSystemPermissionDescriptor {
    mode?: FileSystemPermissionMode;
  }

  interface FileSystemHandle {
    kind: "file" | "directory";
    name: string;

    queryPermission?(descriptor?: FileSystemPermissionDescriptor): Promise<PermissionState>;
    requestPermission?(descriptor?: FileSystemPermissionDescriptor): Promise<PermissionState>;
  }

  interface FileSystemFileHandle extends FileSystemHandle {
    getFile(): Promise<File>;
  }

  // interface FileSystemDirectoryHandle extends FileSystemHandle {
    // ここは敢えて空でOK（反復は scanMp3 側でキャストしてるため）
  // }
}
