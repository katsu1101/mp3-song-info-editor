"use client";

import {useObjectUrlStore}    from "@/hooks/useObjectUrlStore";
import {runWithConcurrency}   from "@/lib/async/runWithConcurrency";
import {readMp3FromDirectory} from "@/lib/fsAccess/scanMp3";
import {readMp3Meta}          from "@/lib/mp3/readMp3Meta";
import type {Mp3Entry}        from "@/types";
import {useMemo, useState}    from "react";

export const useMp3Library = () => {
  const [mp3List, setMp3List] = useState<Mp3Entry[]>([]);
  const [folderName, setFolderName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [titleByPath, setTitleByPath] = useState<Record<string, string | null>>({});
  const covers = useObjectUrlStore();

  const totalSize = useMemo(
    () => mp3List.reduce((sum, item) => sum + item.size, 0),
    [mp3List]
  );

  const pickFolderAndLoad = async () => {
    setErrorMessage("");
    setMp3List([]);
    setFolderName("");
    setTitleByPath({});
    covers.clearAll();

    try {
      if (!("showDirectoryPicker" in window)) {
        setErrorMessage("このブラウザはフォルダ選択（showDirectoryPicker）に対応していません。Chrome/Edgeでお試しください。");
        return;
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const directoryHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({mode: "read"});
      setFolderName(directoryHandle.name);

      const items = await readMp3FromDirectory(directoryHandle, {recursion: true});
      setMp3List(items);

      // メタは後追いで埋める（UIは先に出す）
      void runWithConcurrency(items, 2, async (entry) => {
        const file = await entry.fileHandle.getFile();
        const meta = await readMp3Meta(file);

        setTitleByPath((prev) => ({...prev, [entry.path]: meta.title}));
        covers.setUrl(entry.path, meta.coverUrl);
      });
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : String(e));
    }
  };

  return {
    mp3List,
    folderName,
    errorMessage,
    totalSize,
    titleByPath,
    coverUrlByPath: covers.urlByKey,
    pickFolderAndLoad,
  };
};
