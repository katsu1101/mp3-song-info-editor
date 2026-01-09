/**
 * パスやディレクトリにマッピングされたカバーURLを管理するための構造体を表します。
 */
export type Covers = {
  coverUrlByPath: Record<string, string | null>;
  dirCoverUrlByDir: Record<string, string | null>;
}

/**
 * MP3ファイルのメタデータ情報を表します。
 */
export type Mp3Meta = {
  title?: string;
  artist?: string;
  album?: string;
  trackNo?: number;
  year?: number;
  picture?: { data: Uint8Array; format: string };
  coverUrl?: string; // 互換用
};