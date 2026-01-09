import {FantiaMappingEntry} from "@/types/fantia";

/**
 * 指定された日付文字列を「YYYY-MM」形式から「YYYY/MM」形式に変換します。ハイフンをスラッシュに置換します。
 *
 * @param {string} releaseYm - 変換対象の日付文字列（YYYY-MM形式）。
 * @returns {string} 変換後の日付文字列（YYYY/MM形式）。
 */
const formatYm = (releaseYm: string): string =>
  releaseYm.replace("-", "/");

/**
 * 指定された数値を2文字の文字列としてフォーマットします。必要に応じて先頭にゼロを付加します。
 *
 * @param {number} n - フォーマット対象の数値。
 * @returns {string} 数値の文字列表現。数値が1桁の場合は先頭にゼロを付加します。
 */
const formatOrder2 = (n: number): string =>
  String(n).padStart(2, "0");

/**
 * リリース年-月と月内の注文インデックスを組み合わせたフォーマット済みラベルを生成します。
 *
 * @param {FantiaMappingEntry | undefined} mapping - リリース情報を含むマッピングオブジェクト。
 * @returns {string | null} フォーマットされたリリースラベル（例: "YYYY-MM / Order"）。マッピングが未定義の場合はnullを返す。
 */
export const buildReleaseOrderLabel = (mapping: FantiaMappingEntry | undefined): string | null => {
  if (!mapping) return null;
  const ym = formatYm(mapping.releaseYm);
  const order = formatOrder2(mapping.withinMonthIndex);
  return `${ym} / ${order}`;
};
