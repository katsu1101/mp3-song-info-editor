import {Mp3Entry} from "@/types/mp3Entry";

/**
 * 指定されたディレクトリとそのサブディレクトリから、すべてのMP3ファイルを非同期で読み込み取得します。
 *
 * @param {FileSystemDirectoryHandle} directoryHandle - 読み取るディレクトリのハンドル。
 * @param {string} basePath - ファイルパス構築に使用されるディレクトリのベースパス。
 * @returns {Promise<Mp3Entry[]>} MP3エントリの配列を解決するプロミス。各エントリには、MP3ファイルに関する情報が含まれます。これには、ID、パス、名前、サイズ、最終変更日時、およびファイルハンドルが含まれます。
 *
 * 各MP3エントリには以下が含まれます：
 * - 自動的に割り当てられた一意のID
 * - ベースディレクトリからの相対ファイルパス
 * - ファイル名
 * - ファイルサイズ（バイト単位）
 * - 最終更新時刻（エポックからのミリ秒）
 * - さらなる操作のためのファイルハンドル
 *
 * この関数はディレクトリハンドル内の全項目を反復的に検査します。項目がディレクトリの場合、関数は再帰的にそのディレクトリを走査し、ネストされたディレクトリ内のMP3ファイルを検索します。結果に含まれるのは`.mp3`拡張子を持つファイルのみです（大文字小文字は区別しません）。
 */
export const readMp3FromDirectory = async (
  directoryHandle: FileSystemDirectoryHandle,
  basePath: string
): Promise<Mp3Entry[]> => {

  const entries: Mp3Entry[] = [];

  // ✅ entries() ではなく、AsyncIterableとして反復する
  for await (const [name, handle] of directoryHandle as unknown as AsyncIterable<
    [string, FileSystemHandle]
  >) {
    const currentPath = basePath ? `${basePath}/${name}` : name;

    if (handle.kind === "file") {
      if (!name.toLowerCase().endsWith(".mp3")
        && !name.toLowerCase().endsWith(".m4a")) continue;

      const fileHandle = handle as FileSystemFileHandle;
      const file = await fileHandle.getFile();
      entries.push({
        id: 0,
        path: currentPath,
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        fileHandle,
      });
      continue;
    }

    if (handle.kind === "directory") {
      const child = await readMp3FromDirectory(
        handle as FileSystemDirectoryHandle, currentPath);
      entries.push(...child);
    }
  }

  // ✅ 返却順に連番を確定
  return entries.map((entry, index) => ({...entry, id: index + 1}));
};
