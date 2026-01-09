/**
 * メディアやアイテムの再生に関連する操作を表します。
 * このタイプは、再生動作を制御するためのメソッドを提供します。
 */
export type PlayActions = {
  playAtIndex: (index: number) => Promise<void>;
  playNext: () => Promise<void>;
  playPrev: () => Promise<void>;
}