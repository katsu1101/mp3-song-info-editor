// src/types/trackMeta.ts
/**
 * 音楽トラックのメタデータを表します。
 */
export type TrackMeta = {
  title: string | null;
  artist: string | null;
  album: string | null;
  trackNo: number | null;
  year: number | null;

  // ジャケット（objectURL。無ければ null）
  coverUrl: string | null;
};

/**
 * ファイルパスとそれに対応するトラックメタデータ間のマッピングを表します。
 * 各ファイルパスはキーとして機能し、`TrackMeta`オブジェクト、またはそのパスにメタデータが存在しない場合は`undefined`に関連付けられます。
 *
 * このタイプは通常、ファイルパスに基づいて様々なトラックのメタデータを整理および取得するために使用されます。
 *
 * キー:
 * - 文字列形式の有効なファイルパスである必要があります。
 *
 * 値:
 * - トラックのメタデータ情報を含む `TrackMeta` オブジェクトである可能性があります。
 * - 指定されたファイルパスにメタデータが存在しない場合、`undefined` である可能性もあります。
 *
 * 使用コンテキスト:
 * - オーディオやマルチメディアファイルを扱うアプリケーションにおいて、トラック関連情報を効率的に保存・参照するために有用です。
 */
export type TrackMetaByPath = Record<string, TrackMeta | undefined>;
