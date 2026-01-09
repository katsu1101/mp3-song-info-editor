import {FantiaMappingEntry, FantiaMappingRowInput} from "@/types/fantia";

/**
 * 指定された年と月を表す文字列を構造化された形式に正規化します。
 *
 * 入力文字列は「YYYY-MM」または「YYYY/MM」の形式であることが想定されます。
 * このメソッドは入力を検証し、
 * 年と月が整数であること、および月が有効範囲（1から12）内にあることを確認します。
 * 入力が有効な場合、関数は解析された年、月、および「YYYY-MM」形式の正規化された文字列を含むオブジェクトを返します。
 * 入力が無効な場合、メソッドはnullを返します。
 *
 * @param {string} value - 年と月を表す入力文字列。
 * @returns {{ year: number, month: number, normalized: string } | null}
 *         年、月、正規化された文字列を含むオブジェクト、または入力が無効な場合はnull。
 */
const normalizeReleaseYm = (value: string): { year: number; month: number; normalized: string } | null => {
  const trimmed = value.trim();
  const match = /^(\d{4})[\/-](\d{1,2})$/.exec(trimmed);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month)) return null;
  if (month < 1 || month > 12) return null;

  const mm = String(month).padStart(2, "0");
  return {year, month, normalized: `${year}-${mm}`};
};

/**
 * セルの値をトリムされた文字列であることを保証してクリーンアップします。
 *
 * 指定された値が `undefined` の場合、デフォルトで空の文字列になります。
 * 値が文字列の場合、先頭と末尾の空白は削除されます。
 *
 * @param {string | undefined} value - クリーンアップ対象の入力値。
 * 文字列または `undefined` のいずれかです。
 * @returns {string} - トリミングされた文字列、または入力が `undefined` の場合は空文字列を返します。
 */
const cleanCell = (value: string | undefined): string => (value ?? "").trim();

/**
 * 単一行のテキストを、入力データの行を表す構造化オブジェクトに解析します。
 *
 * 行には特定のフィールドに対応する区切り付き列が含まれている必要があります。
 * 空行、コメント記号（`#`）で始まる行、または検証に失敗した行は無視され、`null`が返されます。
 *
 * @param {string} line - 解析対象のテキスト行。
 * @param {"\t" | ","} delimiter - 行を列に分割する区切り文字。タブ（`\t`）またはコンマ（`,`）のいずれか。
 * @returns {FantiaMappingRowInput | null} 解析されたフィールド（`prefixId`、`releaseYm`、`title`、`originalArtist`）を含む構造化オブジェクト。
 * 行が無効またはスキップすべき場合は`null`を返す。
 */
const parseLineToRow = (line: string, delimiter: "\t" | ","): FantiaMappingRowInput | null => {
  const raw = line.trim();
  if (!raw) return null;
  if (raw.startsWith("#")) return null;

  const cols = raw.split(delimiter);
  // 想定: prefixId, releaseYm, title, originalArtist
  const prefixIdRaw = cleanCell(cols[0]);
  const releaseYm = cleanCell(cols[1]);
  const title = cleanCell(cols[2]);
  const originalArtistRaw = cleanCell(cols[3]);

  if (!releaseYm || !title) return null;

  const prefixId = prefixIdRaw ? prefixIdRaw : null;
  const originalArtist = originalArtistRaw ? originalArtistRaw : null;

  return {prefixId, releaseYm, title, originalArtist};
};

/**
 * 指定されたテキストをFantiaMappingEntryオブジェクトの配列に解析します。
 * この関数は、入力テキストがタブ区切り(TSV)またはカンマ区切り(CSV)のデータテーブルとして構造化されていることを前提とし、
 * 最初の空でない行に基づいて区切り文字を自動的に判定します。
 *
 * 1. テキスト内の各行（「#」で始まるコメント行を除く）は、関連するデータフィールドを抽出するために解析されます。
 * 2. 形式が不正な行は無視されます。
 * 3. 同一リリース月の行については、時系列順に基づいて月内インデックスとトラック番号が自動割り当てされます。
 *
 * @param {string} text - マッピングデータを含む入力テキスト。
 * @returns {FantiaMappingEntry[]} 処理済みマッピングエントリの配列。
 *                                 各エントリは正規化されたデータと割り当てられたインデックスを含む。
 */
export const parseFantiaMappingText = (text: string): FantiaMappingEntry[] => {
  const lines = text.split(/\r?\n/);

  // デリミタ自動判定（最初の非空行にタブが多ければTSV）
  const firstDataLine = lines.find((l) => l.trim() && !l.trim().startsWith("#")) ?? "";
  const delimiter: "\t" | "," = firstDataLine.includes("\t") ? "\t" : ",";

  const rows: FantiaMappingRowInput[] = [];
  for (const line of lines) {
    const row = parseLineToRow(line, delimiter);
    if (row) rows.push(row);
  }

  // 同月内連番を、出現順に 1,2,3... 自動採番
  const withinMonthCounter = new Map<string, number>();

  const entries: FantiaMappingEntry[] = [];
  for (const row of rows) {
    const normalized = normalizeReleaseYm(row.releaseYm);
    if (!normalized) continue; // フォーマット不正は落とす（必要ならログに）
    const {year, month, normalized: releaseYmNormalized} = normalized;

    const key = releaseYmNormalized;
    const nextIndex = (withinMonthCounter.get(key) ?? 0) + 1;
    withinMonthCounter.set(key, nextIndex);

    const track = month * 10 + nextIndex;

    entries.push({
      ...row,
      releaseYm: releaseYmNormalized,
      year,
      month,
      withinMonthIndex: nextIndex,
      track,
    });
  }

  return entries;
};
