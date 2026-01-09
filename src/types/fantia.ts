/**
 * Fantiaマッピングを管理するための状態を表します。
 *
 * この型は、Fantiaシステムにおけるマッピング処理に使用される構造体と、状態管理に関連するメタデータを定義します。
 */
export type FantiaMappingState = {
  mapping: FantiaMappingEntry[];
  mappingByPrefixId: ReadonlyMap<string, FantiaMappingEntry>;
  error: string;
  isLoading: boolean;
};

/**
 * Fantiaマッピング行の入力構造を表します。
 */
export type FantiaMappingRowInput = {
  /** ファイル名先頭の8桁hex（空もあり得る） */
  prefixId: string | null;
  /** "YYYY/MM" or "YYYY-MM" 想定 */
  releaseYm: string;
  /** 曲名 */
  title: string;
  /** 原曲アーティスト（任意。空ならnull） */
  originalArtist: string | null;
};

/**
 * Fantiaのマッピングエントリを表し、基本行入力から派生した追加メタデータを組み込みます。
 * これは、年、月、月内の固有識別子、および順序付け用のトラック番号によってコンテンツを追跡・整理するために使用されます。
 */
export type FantiaMappingEntry = FantiaMappingRowInput & {
  year: number;   // 例: 2024
  month: number;  // 1..12
  /** 同月に複数曲ある場合の連番（1..） */
  withinMonthIndex: number;
  /**
   * 並び安定用のトラック番号（おすすめルール）
   * track = month*10 + withinMonthIndex
   * 例: 9月1曲目=91, 9月2曲目=92
   */
  track: number;
};
