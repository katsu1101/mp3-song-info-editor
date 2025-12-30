// src/types/file-system-access.d.ts
export {};

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

  interface FileSystemDirectoryHandle extends FileSystemHandle {
    // ここは敢えて空でOK（反復は scanMp3 側でキャストしてるため）
  }
}
