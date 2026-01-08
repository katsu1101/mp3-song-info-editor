import type {FantiaMappingEntry, FantiaMappingRowInput} from "@/types/mapping";

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

const cleanCell = (value: string | undefined): string => (value ?? "").trim();

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
