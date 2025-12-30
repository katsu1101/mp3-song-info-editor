"use client";

import {readMp3FromDirectory} from "@/lib/fsAccess/scanMp3";
import {clearDirectoryHandle, loadDirectoryHandle, saveDirectoryHandle} from "@/lib/fsAccess/dirHandleStore";
import {ensureReadPermission} from "@/lib/fsAccess/permissions";
import {Mp3Entry} from "@/types";
import {useEffect, useMemo, useState} from "react";

export default function Page() {
  const [mp3List, setMp3List] = useState<Mp3Entry[]>([]);
  const [folderName, setFolderName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [savedHandle, setSavedHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [needsReconnect, setNeedsReconnect] = useState<boolean>(false);

  const totalSize = useMemo(
    () => mp3List.reduce((sum, item) => sum + item.size, 0),
    [mp3List]
  );

  const rebuildList = async (directoryHandle: FileSystemDirectoryHandle) => {
    setFolderName(directoryHandle.name);
    const items = await readMp3FromDirectory(directoryHandle, {recursion: true});
    setMp3List(items);
  };

  // 起動時：前回のフォルダを復元してみる（権限があれば自動で一覧）
  useEffect(() => {
    const boot = async () => {
      try {
        const handle = await loadDirectoryHandle();
        if (!handle) return;

        setSavedHandle(handle);
        setFolderName(handle.name);

        // 自動では requestPermission しない（ユーザー操作が無難）
        if (typeof handle.queryPermission === "function") {
          const q = await handle.queryPermission({mode: "read"});
          if (q === "granted") {
            await rebuildList(handle);
            setNeedsReconnect(false);
            return;
          }
        }

        setNeedsReconnect(true);
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : String(e));
      }
    };

    void boot();
  }, []);

  const onPickFolder = async () => {
    setErrorMessage("");
    setMp3List([]);
    setFolderName("");
    setNeedsReconnect(false);

    try {
      if (!("showDirectoryPicker" in window)) {
        setErrorMessage("このブラウザはフォルダ選択（showDirectoryPicker）に対応していません。Chrome/Edgeでお試しください。");
        return;
      }

      // @ts-expect-error: lib.dom.d.ts の型が環境によっては未収録
      const directoryHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
        mode: "read",
      });

      // フォルダを保存（次回復元用）
      await saveDirectoryHandle(directoryHandle);
      setSavedHandle(directoryHandle);

      await rebuildList(directoryHandle);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message);
    }
  };

  // “再接続”はユーザー操作で（権限リクエストはここで）
  const onReconnect = async () => {
    setErrorMessage("");
    if (!savedHandle) return;

    const ok = await ensureReadPermission(savedHandle);
    if (!ok) {
      setErrorMessage("フォルダへの読み取り権限が付与されませんでした。もう一度お試しください。");
      setNeedsReconnect(true);
      return;
    }

    await rebuildList(savedHandle);
    setNeedsReconnect(false);
  };

  const onForget = async () => {
    await clearDirectoryHandle();
    setSavedHandle(null);
    setNeedsReconnect(false);
    setFolderName("");
    setMp3List([]);
  };

  return (
    <main style={{padding: 16, maxWidth: 900, margin: "0 auto"}}>
      <h1 style={{fontSize: 22, fontWeight: 700}}>MP3曲情報エディター（テスト）</h1>

      <div style={{display: "flex", gap: 12, alignItems: "center", marginTop: 12, flexWrap: "wrap"}}>
        <button
          onClick={onPickFolder}
          style={{padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc"}}
        >
          フォルダを選ぶ
        </button>

        {needsReconnect ? (
          <button
            onClick={onReconnect}
            style={{padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc"}}
          >
            前回のフォルダに再接続
          </button>
        ) : null}

        {savedHandle ? (
          <button
            onClick={onForget}
            style={{padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc"}}
          >
            記憶を消す
          </button>
        ) : null}

        {folderName ? <div>選択中: <b>{folderName}</b></div> : <div>未選択</div>}
      </div>

      {errorMessage ? (
        <p style={{marginTop: 12, color: "crimson"}}>エラー: {errorMessage}</p>
      ) : null}

      <div style={{marginTop: 16}}>
        <div style={{display: "flex", gap: 16}}>
          <div>MP3件数: <b>{mp3List.length}</b></div>
          <div>合計サイズ: <b>{(totalSize / (1024 * 1024)).toFixed(2)} MB</b></div>
        </div>

        <ul style={{marginTop: 12, paddingLeft: 18}}>
          {mp3List.map((item) => (
            <li key={item.path} style={{marginBottom: 6}}>
              <div><b>{item.path}</b></div>
              <div style={{fontSize: 12, opacity: 0.8}}>
                {(item.size / 1024).toFixed(1)} KB /
                {" "}更新: {new Date(item.lastModified).toLocaleString("ja-JP")}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
