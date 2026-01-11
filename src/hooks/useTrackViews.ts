import {getBasename}             from "@/components/NowPlayingPanel";
import {extractPrefixIdFromPath} from "@/lib/mapping/extractPrefixId";
import {getDirname}              from "@/lib/path/getDirname";
import {buildReleaseOrderLabel}  from "@/lib/playlist/label";
import {FantiaMappingEntry}      from "@/types/fantia";
import {Covers}                  from "@/types/mp3";
import type {Mp3Entry}           from "@/types/mp3Entry";
import {TrackMetaByPath}         from "@/types/trackMeta";
import {TrackView}               from "@/types/views";

/**
 * `useTrackViews` 機能に必要な引数を表します。
 *
 * このタイプは、MP3エントリ、メタデータ集約、カバー情報、およびプレフィックス識別子によるマッピングに関連するデータをカプセル化します。
 * トラックビューおよびメタデータ処理を扱う操作に必要な入力を提供します。
 *
 * プロパティ:
 * - `mp3List`: トラックビューの主要な構成要素であるMP3エントリのコレクション。
 * - `metaByPath`: トラックに関連付けられたメタデータの集約。パスによって識別される。
 * - `covers`: カバーデータの表現。構造体はトラックとフォルダ代表に関する情報を保持する。
 * - `mappingByPrefixId`: プレフィックスIDとFantiaマッピングエントリとの読み取り専用マッピング。
 */
type UseTrackViewsArgs = {
  mp3List: Mp3Entry[];

  // ✅ TrackMeta の集約を受け取る
  metaByPath: TrackMetaByPath;

  // ✅ cover（曲 > フォルダ代表）はこのまま
  covers: Covers;

  mappingByPrefixId: ReadonlyMap<string, FantiaMappingEntry>;
};

/**
 * 数値を2桁の文字列表現に変換します。
 * 数値が1桁の場合、先頭に0を付加します。
 *
 * @param {number} n - 2桁の文字列に変換する数値。
 * @returns {string} 指定された数値の2桁の文字列表現。
 */
const toTwoDigits = (n: number): string => String(n).padStart(2, "0");

/**
 * 入力値を正規化し、文字列から周囲の空白をトリミングします。
 * 入力が文字列でない場合、またはトリミング結果が空文字列の場合、nullを返します。
 * それ以外の場合は、トリミングされた文字列を返します。
 *
 * @param {unknown} value - 正規化する入力値。
 * @returns {string | null} - 正規化された文字列。入力が有効な文字列でない場合は null。
 */
const normalizeText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * MP3ファイルのリストを処理し、追加のメタデータを含むトラックビューの配列を生成する関数。
 *
 * @param {UseTrackViewsArgs} args - 以下のプロパティを含むオブジェクト：
 *   - `mp3List` (配列): MP3ファイルオブジェクトのリスト。
 *   - `metaByPath` (オブジェクト): ファイルパスとメタデータ（タイトル、アルバム、アーティストなどの詳細を含む）のマッピング。
 *   - `covers` (オブジェクト): ファイルパスおよびディレクトリごとのカバー画像URLのマッピングを含むオブジェクト。
 *   - `mappingByPrefixId` (マップ): プレフィックスIDとマッピングオブジェクトのマップ。通常、トラックに関連する追加情報（例: タイトル、オリジナルアーティスト）を含む。
 * @returns {TrackView[]} トラックビューの配列。各トラックビューには、処理済みメタデータ、順序ラベル、およびMP3ファイルに関連するその他の属性が含まれます。
 *
 * 返されるトラックビューには以下が含まれます：
 * - `displayTitle`: メタデータ、マッピング、またはデフォルト値から決定される、ユーザーフレンドリーなトラックタイトル。
 * - `orderLabel`: アルバムまたはリリース日に基づくトラックの順序を説明する文字列。
 * - `originalArtist`: メタデータまたはマッピングから正規化された、トラックに関連付けられたアーティスト。
 * - `coverUrl`: ファイル固有またはディレクトリ固有のカバーマッピングから導出された、トラックのカバー画像のURL。
 * - `index` や生の `item` データを含む、追加の技術的詳細。
 */
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

    const filename = getBasename(item.path);
    const displayTitle = mapping?.title ?? meta?.title ?? filename;

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
