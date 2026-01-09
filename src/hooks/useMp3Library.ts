"use client";

import {IMAGE_EXTS}                                                     from "@/const/constants";
import {useObjectUrlStore}                                              from "@/hooks/useObjectUrlStore";
import {runWithConcurrency}                                             from "@/lib/async/runWithConcurrency";
import {clearDirectoryHandle, loadDirectoryHandle, saveDirectoryHandle} from "@/lib/fsAccess/dirHandleStore";
import {readMp3FromDirectory}                                           from "@/lib/fsAccess/scanMp3";
import {readMp3Meta}                                                    from "@/lib/mp3/readMp3Meta";
import {getDirname}                                                     from "@/lib/path/getDirname";
import {shuffleArray}                                                   from "@/lib/shuffle";
import {Covers, Mp3Meta}                                                from "@/types/mp3";
import type {Mp3Entry}                                                  from "@/types/mp3Entry";
import {SettingAction}                                                  from "@/types/setting";
import {TrackMeta, TrackMetaByPath}                                     from "@/types/trackMeta";
import React, {useEffect, useState}                                     from "react";

/**
 * イメージ候補オブジェクトを表し、イメージの名前と、
 * 関連付けられたファイルシステムファイルへのハンドルを含みます。
 *
 * プロパティ:
 * - name: 画像ファイルの名前を文字列で表します。
 * - handle: ファイルシステム上で画像ファイルを操作およびやり取りする手段を提供する `FileSystemFileHandle` オブジェクトです。
 */
type ImageCandidate = { name: string; handle: FileSystemFileHandle };

/**
 * 非同期的に、アプリケーションが指定されたファイルシステムディレクトリハンドルから読み取り可能かどうかを確認します。
 *
 * このメソッドは、指定されたディレクトリハンドルに対する読み取り権限を判定します。
 * ディレクトリハンドルが`queryPermission`メソッドをサポートしていない場合、読み取り権限が付与されていると仮定し、`true`を返します。
 *
 * それ以外の場合は、読み取りモードで現在の権限状態を問い合わせます。権限状態が「許可済み」の場合、`true`を返します。
 * 「拒否」や「プロンプト」などの他の状態の場合、`false`を返します。
 *
 * @param {FileSystemDirectoryHandle} handle - 読み取り権限を確認するファイルシステムディレクトリハンドル。
 * @returns {Promise<boolean>} 読み取りアクセスが許可された場合に `true`、そうでない場合に `false` を解決するプロミス。
 */
const canReadNow = async (handle: FileSystemDirectoryHandle): Promise<boolean> => {
  if (!handle.queryPermission) return true;
  const state = await handle.queryPermission({mode: "read"});
  return state === "granted";
};

/**
 * 指定されたファイルシステムディレクトリハンドルに対する読み取りアクセス許可を非同期で要求します。
 *
 * @param {FileSystemDirectoryHandle} handle - 読み取り権限を要求するファイルシステムディレクトリハンドル。
 * @returns {Promise<boolean>} 権限が許可されたかどうかを示すブール値を解決するプロミス。
 */
const requestRead = async (handle: FileSystemDirectoryHandle): Promise<boolean> => {
  if (!handle.requestPermission) return false;
  const state = await handle.requestPermission({mode: "read"});
  return state === "granted";
};

/**
 * 指定されたファイル名からファイル拡張子を抽出し、小文字に変換します。
 * 拡張子が見つからない場合、空の文字列を返します。
 *
 * @param {string} name - 拡張子を含むファイルの完全な名前。
 * @returns {string} - 小文字のファイル拡張子、または拡張子が存在しない場合は空の文字列。
 */
const getLowerExt = (name: string): string => {
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex < 0) return "";
  return name.slice(dotIndex + 1).toLowerCase();
};

/**
 * 指定されたパスをルートディレクトリハンドルに対する相対パスとして、ディレクトリハンドルを解決します。
 *
 * この関数は、指定されたルートディレクトリハンドルから開始し、指定されたディレクトリパスに沿ってファイルシステムのディレクトリ構造を移動します。
 * 目的のパスに対応する結果のディレクトリハンドルが返されます。
 *
 * 指定された `dirPath` が空文字列であるか、指定されていない場合、ルートディレクトリハンドルが直ちに返されます。
 *
 * @param {FileSystemDirectoryHandle} rootHandle - パスを解決する起点となるディレクトリハンドル。
 * @param {string} dirPath - ルートハンドルからの相対パス。区切り文字は "/" を使用。
 * @returns {Promise<FileSystemDirectoryHandle>} 指定されたパスのディレクトリハンドルを解決するプロミス。
 * @throws {DOMException} パスの一部が存在しないか、アクセスが拒否された場合。
 */
const resolveDirectoryHandle = async (
  rootHandle: FileSystemDirectoryHandle,
  dirPath: string
): Promise<FileSystemDirectoryHandle> => {
  if (!dirPath) return rootHandle;

  const parts = dirPath.split("/").filter(Boolean);
  let currentHandle: FileSystemDirectoryHandle = rootHandle;

  for (const part of parts) {
    currentHandle = await currentHandle.getDirectoryHandle(part, {create: false});
  }
  return currentHandle;
};

/**
 * 指定されたディレクトリ内で最初の画像ファイルハンドルを非同期で検索します。
 *
 * この関数は、渡された`FileSystemDirectoryHandle`を反復処理し、ファイル以外のエントリと、許可された画像ファイル拡張子を持たないエントリを除外します。
 * 許可された画像ファイル拡張子は`IMAGE_EXTS`セットによって決定されます。
 * 最初に一致した画像ファイルハンドルが返されます。画像ファイルが見つからない場合は`null`が返されます。
 *
 * 結果はファイル名順に並べ替えられ、一貫した再現性を確保します。
 *
 * @param {FileSystemDirectoryHandle} directoryHandle - 画像ファイルを検索するディレクトリハンドル。
 * @returns {Promise<FileSystemFileHandle | null>} 最初の画像ファイルのファイルハンドルを解決するプロミス。画像ファイルが見つからない場合は`null`を返す。
 */
const findFirstImageFileHandle = async (
  directoryHandle: FileSystemDirectoryHandle
): Promise<FileSystemFileHandle | null> => {
  const candidates: ImageCandidate[] = [];

  // TSのlib定義差を吸収（環境によって entries() の型が薄い）
  const iterable = (directoryHandle as unknown as {
    entries: () => AsyncIterable<[string, FileSystemHandle]>
  }).entries();

  for await (const [name, entry] of iterable) {
    if (entry.kind !== "file") continue;

    const ext = getLowerExt(name);
    if (!IMAGE_EXTS.has(ext)) continue;

    candidates.push({name, handle: entry as FileSystemFileHandle});
  }

  // 再現性のためファイル名でソート
  // candidates.sort((a, b) => a.name.localeCompare(b.name, "ja"));

  return candidates[0]?.handle ?? null;
};

/**
 * 提供された画像データとフォーマットに基づいて、カバー画像オブジェクトのURLを生成します。
 *
 * @param {Object} [picture] - カバーオブジェクトURLを生成するための画像データと形式。
 * @param {Uint8Array} picture.data - 画像のバイナリデータ。
 * @param {string} picture.format - 画像のMIMEタイプ形式（例: "image/png"、"image/jpeg"）。
 * @returns {string | null} 成功した場合の画像オブジェクトURLを表す文字列、または画像データが提供されていないか環境がサポートしていない場合のnull。
 */
const createCoverObjectUrl = (
  picture?: { data: Uint8Array; format: string },
): string | null => {
  if (!picture) return null;
  if (typeof window === "undefined") return null;

  // Uint8Array の「有効部分」だけを ArrayBuffer にコピーして Blob 化
  const bytes = picture.data;
  const arrayBuffer = bytes.slice().buffer; // slice() で新しい Uint8Array を作り、その buffer は ArrayBuffer になる

  const blob = new Blob([arrayBuffer], {type: picture.format});
  return URL.createObjectURL(blob);
};

/**
 * MP3ライブラリを管理するためのフック。このフックは、ディレクトリからのMP3ファイルの読み込み、
 * メタデータの管理、トラックのシャッフル、エラー処理、ディレクトリ権限、アルバムアートの可視化のための状態維持などの操作を処理します。
 *
 * @param {boolean} shuffle MP3リストを読み込む際にシャッフルするかどうかを示します。
 * @returns 以下のプロパティを含むオブジェクト：
 * - `covers` {Covers} - アルバムアートワークのURLを含むオブジェクト：
 *   - `coverUrlByPath` {object} - ファイルパスと対応するアルバムアートURLのマッピング。
 *   - `dirCoverUrlByDir` {object} - フォルダパスと代表的なアルバムアートURLのマッピング。
 * - `settingAction` {SettingAction} - フォルダ設定とアクションを管理するオブジェクト：
 *   - `folderName` {string} - 現在選択されているフォルダ名。
 *   - `errorMessage` {string} - 操作の結果として発生したエラーメッセージ。
 *   - `metaByPath` {TrackMetaByPath} - ファイルパスと関連するトラックメタデータのマッピング。
 *   - `savedHandle` {FileSystemDirectoryHandle|null} - 利用可能な場合、保存済みディレクトリのハンドルへの参照。
 *   - `needsReconnect` {boolean} - ディレクトリへの再接続にユーザー操作が必要かどうか。
 *   - `pickFolderAndLoad` {関数} - フォルダを選択し、そのMP3ファイルを読み込むようユーザーに促す関数。
 *   - `reconnect` {関数} - 以前に保存されたディレクトリハンドルへの再接続を試みる関数。
 *   - `forget` {関数} - 保存されたディレクトリハンドルをクリアし、状態をリセットする関数。
 */
export const useMp3Library = (shuffle: boolean) => {
  const [mp3List, setMp3List] = useState<Mp3Entry[]>([]);
  const [folderName, setFolderName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [savedHandle, setSavedHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [needsReconnect, setNeedsReconnect] = useState(false);

  // ✅ TrackMeta を一括管理（path -> meta）
  const [metaByPath, setMetaByPath] = useState<TrackMetaByPath>({});

  // ✅ MP3埋め込みジャケット（曲ごと）
  const covers = useObjectUrlStore();

  // ✅ フォルダ代表ジャケット（フォルダごと）
  const dirCovers = useObjectUrlStore();

  const resetView = () => {
    setErrorMessage("");
    setMp3List([]);
    setFolderName("");
    setMetaByPath({});
    covers.clearAll();
    dirCovers.clearAll();
  };

  const toTrackMeta = (
    meta: Mp3Meta, coverUrl: string | null, fileName: string
  ): TrackMeta => {
    return {
      title: meta.title ?? fileName,
      artist: meta.artist ?? "",
      album: meta.album ?? "",
      trackNo: meta.trackNo ?? null,
      year: meta.year ?? null,
      coverUrl,
    };
  };

  const buildList = async (handle: FileSystemDirectoryHandle) => {
    setFolderName(handle.name);

    let items = await readMp3FromDirectory(handle, "");

    if (shuffle) {
      items = shuffleArray(items)
      for (let i = 0; i < items.length; i++) {
        items[i].id = i + 1;
      }
    }
    setMp3List(items);

    // ✅ フォルダ代表画像（先に作っておく：表示フォールバック用）
    void (async () => {
      const dirPaths = Array.from(new Set(items.map((x) => getDirname(x.path))));
      void runWithConcurrency(dirPaths, 2, async (dirPath) => {
        try {
          const dirHandle = await resolveDirectoryHandle(handle, dirPath);
          const imgHandle = await findFirstImageFileHandle(dirHandle);
          if (!imgHandle) return;

          const file = await imgHandle.getFile();
          const url = URL.createObjectURL(file);
          dirCovers.setUrl(dirPath, url);
        } catch {
          // フォルダが消えた/権限等は無視（フォールバック無しになるだけ）
        }
      });
    })();

    // ✅ MP3メタは後追い（TrackMeta へ集約）
    void runWithConcurrency(items, 2, async (entry) => {
      const file = await entry.fileHandle.getFile();
      const meta = await readMp3Meta(file); // TrackMeta を返す想定

      // coverUrl の objectURL は store に管理させる（差し替え時に revoke できる）
      const coverUrl: string | null = createCoverObjectUrl(meta.picture);
      covers.setUrl(entry.path, coverUrl ?? null);

      const trackMeta: TrackMeta = toTrackMeta(meta, coverUrl, file.name);

      setMetaByPath((prev) => ({
        ...prev,
        [entry.path]: trackMeta,
      }));
    });
  };

  // ✅ 起動時に復元
  useEffect(() => {
    const boot = async () => {
      try {
        const handle = await loadDirectoryHandle();
        if (!handle) return;

        setSavedHandle(handle);
        setFolderName(handle.name);

        const ok = await canReadNow(handle);
        if (ok) {
          await buildList(handle);
          setNeedsReconnect(false);
        } else {
          setNeedsReconnect(true);
        }
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : String(e));
      }
    };

    void boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ フォルダ選択（ここで保存）
  const pickFolderAndLoad = async () => {
    resetView();
    setNeedsReconnect(false);

    try {
      if (!("showDirectoryPicker" in window)) {
        setErrorMessage("このブラウザはフォルダ選択に対応していません。Chrome/Edgeでお試しください。");
        return;
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const handle: FileSystemDirectoryHandle = await window.showDirectoryPicker({mode: "read"});

      await saveDirectoryHandle(handle);
      setSavedHandle(handle);

      await buildList(handle);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : String(e));
    }
  };

  // ✅ 再接続（ユーザー操作で権限要求）
  const reconnect = async () => {
    setErrorMessage("");
    if (!savedHandle) return;

    const ok = await requestRead(savedHandle);
    if (!ok) {
      setNeedsReconnect(true);
      setErrorMessage("フォルダへの読み取り権限が付与されませんでした。");
      return;
    }

    await buildList(savedHandle);
    setNeedsReconnect(false);
  };

  const forget = async () => {
    await clearDirectoryHandle();
    setSavedHandle(null);
    setNeedsReconnect(false);
    resetView();
  };

  return {
    mp3List,

    // ✅ カバーURL（曲/フォルダ）
    covers: {
      coverUrlByPath: covers.urlByKey,
      dirCoverUrlByDir: dirCovers.urlByKey,
    } as Covers,

    settingAction: {
      folderName,
      errorMessage,
      // ✅ TrackMeta 本体
      metaByPath,
      savedHandle,
      needsReconnect,
      pickFolderAndLoad,
      reconnect,
      forget,
    } as SettingAction
  };
};

/**
 * 2つの`Mp3Entry`オブジェクトの配列を比較し、それらが同じ順序で同じパスを持つかどうかを判定します。
 *
 * @param {ReadonlyArray<Mp3Entry>} a - 比較対象の最初の `Mp3Entry` オブジェクトの配列。
 * @param {ReadonlyArray<Mp3Entry>} b - 比較対象の 2 番目の `Mp3Entry` オブジェクトの配列。
 * @returns {boolean} 両方の配列が同じ順序で同じパスを持つ場合、`true`を返します。それ以外の場合は`false`を返します。
 */
const samePaths = (a: readonly Mp3Entry[], b: readonly Mp3Entry[]): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i]!.path !== b[i]!.path) return false;
  }
  return true;
};

/**
 * 入力パラメータに基づいてMp3Entry項目の順序付きリストを提供するフック関数。
 * この関数では、リストをアルファベット順またはシャッフル順で並べ替えることが可能です。
 * また、指定されたトリガーが変更された際にシャッフル順を再トリガーする機能も提供します。
 *
 * @param {readonly Mp3Entry[]} mp3List - 処理対象のMp3Entryオブジェクトの入力リスト。
 * @param {boolean} shuffle - リストをシャッフルするかどうかを決定します。falseの場合、リストはアルファベット順にソートされます。
 * @param {number} shuffleVersion - `shuffle`がtrueの場合、変更時にリストの再シャッフルを強制するトリガー値。
 * @returns {Mp3Entry[]} 指定された設定を考慮した、入力Mp3Entryリストの順序付け済みバージョン。
 */
export const useOrderedMp3List = (
  mp3List: readonly Mp3Entry[],
  shuffle: boolean,
  shuffleVersion: number // 再シャッフル用トリガー
): Mp3Entry[] => {
  const [ordered, setOrdered] = React.useState<Mp3Entry[]>(() => [...mp3List]);

  // mp3List の中身変化検出（参照が新しくても、内容が同じなら順番を維持したい用）
  const fingerprint = React.useMemo(
    () => mp3List.map((x) => x.path).join("\n"),
    [mp3List]
  );

  React.useEffect(() => {
    const next = shuffle
      ? shuffleArray(mp3List)
      : [...mp3List].sort((a, b) => a.path.localeCompare(b.path, "ja"));

    setOrdered((prev) => (samePaths(prev, next) ? prev : next));
  }, [fingerprint, mp3List, shuffle, shuffleVersion]);

  return ordered;
}