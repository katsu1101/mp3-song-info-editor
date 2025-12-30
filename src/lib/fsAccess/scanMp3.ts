import {Mp3Entry} from "@/types";

export const readMp3FromDirectory = async (
  directoryHandle: FileSystemDirectoryHandle,
  options?: { recursion?: boolean; basePath?: string }
): Promise<Mp3Entry[]> => {
  const recursion = options?.recursion ?? true;
  const basePath = options?.basePath ?? "";

  const entries: Mp3Entry[] = [];

  // ✅ entries() ではなく、AsyncIterableとして反復する
  for await (const [name, handle] of directoryHandle as unknown as AsyncIterable<
    [string, FileSystemHandle]
  >) {
    const currentPath = basePath ? `${basePath}/${name}` : name;

    if (handle.kind === "file") {
      if (!name.toLowerCase().endsWith(".mp3")) continue;

      const fileHandle = handle as FileSystemFileHandle;
      const file = await fileHandle.getFile();
      entries.push({
        path: currentPath,
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        fileHandle, // ★追加
      });
      continue;
    }

    if (handle.kind === "directory" && recursion) {
      const child = await readMp3FromDirectory(handle as FileSystemDirectoryHandle, {
        recursion,
        basePath: currentPath,
      });
      entries.push(...child);
    }
  }

  entries.sort((a, b) => a.path.localeCompare(b.path, "ja"));
  return entries;
};
