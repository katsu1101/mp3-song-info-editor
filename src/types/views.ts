import type {Mp3Entry} from "@/types/mp3Entry";

/**
 * トラックとその関連メタデータを表示するためのビューモデルを表します。
 */
export type TrackView = {
  item: Mp3Entry;
  displayTitle: string;

  orderLabel: string;            // ✅ アルバム/順 or 年月/順（最終表示）
  originalArtist: string | null; // ✅ アーティスト優先、無ければ原曲

  coverUrl: string | null;
};
