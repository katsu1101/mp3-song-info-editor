import {getDirname}              from "@/hooks/src/lib/path/getDirname";
import {TrackMetaByPath}         from "@/hooks/src/types/trackMeta";
import {Covers}                  from "@/hooks/useMp3Library";
import {extractPrefixIdFromPath} from "@/lib/mapping/extractPrefixId";
import {buildReleaseOrderLabel}  from "@/lib/playlist/label";
import type {Mp3Entry}           from "@/types";
import type {FantiaMappingEntry} from "@/types/mapping";

type UseTrackViewsArgs = {
  mp3List: Mp3Entry[];

  // ✅ TrackMeta の集約を受け取る
  metaByPath: TrackMetaByPath;

  // ✅ cover（曲 > フォルダ代表）はこのまま
  covers: Covers;

  mappingByPrefixId: ReadonlyMap<string, FantiaMappingEntry>;
};

export type TrackView = {
  item: Mp3Entry;
  displayTitle: string;

  orderLabel: string;            // ✅ アルバム/順 or 年月/順（最終表示）
  originalArtist: string | null; // ✅ アーティスト優先、無ければ原曲

  coverUrl: string | null;
};

const toTwoDigits = (n: number) => String(n).padStart(2, "0");

const normalizeText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const useTrackViews = (args: UseTrackViewsArgs): TrackView[] => {
  const {mp3List, metaByPath, covers, mappingByPrefixId} = args;

  // ここはただの計算。副作用（localStorage書き込み/乱数で順序変更など）は入れないのが安全。
  const decorated = mp3List.map((item, originalIndex) => {
    const key = item.id
    return {item, key, originalIndex};
  });

  return decorated.map(({item}, index) => {
    const meta = metaByPath[item.path];

    const prefixId = extractPrefixIdFromPath(item.path);
    const mapping = prefixId ? mappingByPrefixId.get(prefixId) : undefined;

    const displayTitle = mapping?.title ?? meta?.title ?? "（曲名なし）";

    const albumName = meta?.album ?? null;
    const trackNo = meta?.trackNo ?? null;

    const albumOrderLabel =
      albumName ? (trackNo ? `${albumName} / ${toTwoDigits(trackNo)}` : albumName) : null;

    const releaseOrderLabel = buildReleaseOrderLabel(mapping) ?? "年月不明";
    const orderLabel = albumOrderLabel ?? releaseOrderLabel;

    const tagArtist = normalizeText(meta?.artist);
    const mappingOriginal = normalizeText(mapping?.originalArtist);
    const originalArtist = tagArtist ?? mappingOriginal;

    const dirPath = getDirname(item.path);
    const coverUrl =
      covers.coverUrlByPath[item.path] ?? covers.dirCoverUrlByDir[dirPath] ?? null;

    return {
      item,
      index,
      displayTitle,
      orderLabel,
      originalArtist,
      coverUrl,
    };
  });
};
