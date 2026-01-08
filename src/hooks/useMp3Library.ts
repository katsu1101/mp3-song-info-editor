"use client";

import {getDirname}                                                     from "@/hooks/src/lib/path/getDirname";
import {useObjectUrlStore}                                              from "@/hooks/useObjectUrlStore";
import {runWithConcurrency}                                             from "@/lib/async/runWithConcurrency";
import {clearDirectoryHandle, loadDirectoryHandle, saveDirectoryHandle} from "@/lib/fsAccess/dirHandleStore";
import {readMp3FromDirectory}                                           from "@/lib/fsAccess/scanMp3";
import {Mp3Meta, readMp3Meta}                                           from "@/lib/mp3/readMp3Meta";
import {shuffleArray}                                                   from "@/lib/shuffle";
import type {Mp3Entry}                                                  from "@/types";
import React, {useEffect, useState}                                     from "react";
import {TrackMeta, TrackMetaByPath}                                     from "./src/types/trackMeta";

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif"]);

type ImageCandidate = { name: string; handle: FileSystemFileHandle };

export type Covers = {
  coverUrlByPath: Record<string, string | null>;
  dirCoverUrlByDir: Record<string, string | null>;
}

export type SettingAction = {
  folderName: string,
  errorMessage: string,
  // ✅ TrackMeta 本体
  metaByPath: TrackMetaByPath,
  savedHandle: FileSystemDirectoryHandle | null,
  needsReconnect: boolean,
  pickFolderAndLoad: () => Promise<void>;
  reconnect: () => Promise<void>;
  forget: () => Promise<void>;
}

const canReadNow = async (handle: FileSystemDirectoryHandle): Promise<boolean> => {
  if (!handle.queryPermission) return true;
  const state = await handle.queryPermission({mode: "read"});
  return state === "granted";
};

const requestRead = async (handle: FileSystemDirectoryHandle): Promise<boolean> => {
  if (!handle.requestPermission) return false;
  const state = await handle.requestPermission({mode: "read"});
  return state === "granted";
};

const getLowerExt = (name: string): string => {
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex < 0) return "";
  return name.slice(dotIndex + 1).toLowerCase();
};

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

// useMp3Library.ts（適当な場所にヘルパー追加）
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


const samePaths = (a: readonly Mp3Entry[], b: readonly Mp3Entry[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i]!.path !== b[i]!.path) return false;
  }
  return true;
};

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