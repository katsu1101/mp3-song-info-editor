import {getDirname}                   from "@/hooks/src/lib/path/getDirname";
import {TrackMetaByPath}              from "@/hooks/src/types/trackMeta";
import {extractPrefixIdFromPath}      from "@/lib/mapping/extractPrefixId";
import {buildReleaseOrderLabel}       from "@/lib/playlist/label";
import {buildSortKey, compareSortKey} from "@/lib/playlist/sort";
import type {Mp3Entry}                from "@/types";
import type {FantiaMappingEntry}      from "@/types/mapping";
import {useMemo}                      from "react";

export type TrackView = {
  item: Mp3Entry;
  index: number;
  displayTitle: string;

  orderLabel: string;            // ✅ アルバム/順 or 年月/順（最終表示）
  originalArtist: string | null; // ✅ アーティスト優先、無ければ原曲

  coverUrl: string | null;
};

type UseTrackViewsArgs = {
  mp3List: Mp3Entry[];

  // ✅ TrackMeta の集約を受け取る
  metaByPath: TrackMetaByPath;

  // ✅ cover（曲 > フォルダ代表）はこのまま
  coverUrlByPath: Record<string, string | null | undefined>;
  dirCoverUrlByDir: Record<string, string | null | undefined>;

  mappingByPrefixId: ReadonlyMap<string, FantiaMappingEntry>;
};

const toTwoDigits = (n: number) => String(n).padStart(2, "0");

export const useTrackViews = (args: UseTrackViewsArgs): TrackView[] => {
  const {mp3List, metaByPath, coverUrlByPath, dirCoverUrlByDir, mappingByPrefixId} = args;

  return useMemo(() => {
    const decorated = mp3List.map((item, originalIndex) => {
      const key = buildSortKey(item, mappingByPrefixId);
      return {item, key, originalIndex};
    });

    decorated.sort((a, b) => {
      const diff = compareSortKey(a.key, b.key);
      return diff !== 0 ? diff : a.originalIndex - b.originalIndex;
    });

    return decorated.map(({item}, index) => {
      const meta = metaByPath[item.path];

      const prefixId = extractPrefixIdFromPath(item.path);
      const mapping = prefixId ? mappingByPrefixId.get(prefixId) : undefined;

      // 曲名： mapping > タグtitle > (曲名なし)
      const displayTitle = mapping?.title ?? meta?.title ?? "（曲名なし）";

      // ✅ 年月/順：アルバム名/トラック番号があれば優先
      const albumName = meta?.album ?? null;
      const trackNo = meta?.trackNo ?? null;

      const albumOrderLabel =
        albumName
          ? (trackNo ? `${albumName} / ${toTwoDigits(trackNo)}` : albumName)
          : null;

      const releaseOrderLabel = buildReleaseOrderLabel(mapping) ?? "年月不明";
      const orderLabel = albumOrderLabel ?? releaseOrderLabel;

      // ✅ 原曲：アーティストがあれば優先（無ければ mapping.originalArtist）
      const originalArtist = meta?.artist ?? mapping?.originalArtist ?? null;

      // cover：曲の埋め込み > フォルダ代表
      const dirPath = getDirname(item.path);
      const coverUrl =
        coverUrlByPath[item.path] ??
        dirCoverUrlByDir[dirPath] ??
        null;

      return {
        item,
        index,
        displayTitle,
        orderLabel,
        originalArtist,
        coverUrl,
      };
    });
  }, [mp3List, metaByPath, coverUrlByPath, dirCoverUrlByDir, mappingByPrefixId]);
};
