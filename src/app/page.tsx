"use client";

import jsmediatags from "jsmediatags";
import {useMemo, useState} from "react";
import type {Mp3Entry} from "@/types";
import {readMp3FromDirectory} from "@/lib/fsAccess/scanMp3";

// ID3タイトル取得（Promise化）
const readTitleFromFile = (file: File): Promise<string | null> =>
  new Promise((resolve) => {
    jsmediatags.read(file, {
      onSuccess: (result) => {
        const title = (result.tags as any)?.title;
        resolve(typeof title === "string" && title.trim() ? title.trim() : null);
      },
      onError: () => resolve(null),
    });
  });

// 並列数制限つきでタイトル取得
const loadTitles = async (
  entries: Mp3Entry[],
  onTitle: (path: string, title: string | null) => void
) => {
  const concurrency = 4;
  const queue = [...entries];

  const worker = async () => {
    while (queue.length > 0) {
      const entry = queue.shift();
      if (!entry) return;
      const file = await entry.fileHandle.getFile();
      const title = await readTitleFromFile(file);
      onTitle(entry.path, title);
    }
  };

  await Promise.all(Array.from({length: concurrency}, worker));
};

export default function Page() {
  const [mp3List, setMp3List] = useState<Mp3Entry[]>([]);
  const [titleByPath, setTitleByPath] = useState<Record<string, string | null>>({});

  const [folderName, setFolderName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const totalSize = useMemo(
    () => mp3List.reduce((sum, item) => sum + item.size, 0),
    [mp3List]
  );

  const onPickFolder = async () => {
    setErrorMessage("");
    setMp3List([]);
    setTitleByPath({});
    setFolderName("");

    try {
      if (!("showDirectoryPicker" in window)) {
        setErrorMessage("このブラウザはフォルダ選択（showDirectoryPicker）に対応していません。Chrome/Edgeでお試しください。");
        return;
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const directoryHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
        mode: "read",
      });

      setFolderName(directoryHandle.name);

      const items = await readMp3FromDirectory(directoryHandle, {recursion: true});
      setMp3List(items);

      // タイトル取得を開始（表示は先に出して、タイトルは後から埋める）
      void loadTitles(items, (path, title) => {
        setTitleByPath((prev) => ({...prev, [path]: title}));
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message);
    }
  };

  return (
    <main style={{padding: 16, maxWidth: 900, margin: "0 auto"}}>
      <button onClick={onPickFolder}>フォルダを選ぶ</button>

      <div style={{marginTop: 12}}>
        {folderName ? <div>選択中: <b>{folderName}</b></div> : <div>未選択</div>}
        {errorMessage ? <p style={{color: "crimson"}}>エラー: {errorMessage}</p> : null}
      </div>

      <div style={{marginTop: 12}}>
        <div>MP3件数: <b>{mp3List.length}</b></div>
        <div>合計サイズ: <b>{(totalSize / (1024 * 1024)).toFixed(2)} MB</b></div>

        <ul style={{marginTop: 12}}>
          {mp3List.map((item) => {
            const title = titleByPath[item.path];
            return (
              <li key={item.path}>
                <b>{title ?? "（タイトル取得中/なし）"}</b>{" "}
                <span style={{opacity: 0.8}}>{item.path}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
