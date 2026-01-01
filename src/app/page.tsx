"use client";

import {readId3v2Basic}                       from "@/lib/id3/readId3v2";
import jsmediatags                            from "jsmediatags";
import {readMp3FromDirectory}                 from "@/lib/fsAccess/scanMp3";
import {Mp3Entry}                             from "@/types";
import {useEffect, useMemo, useRef, useState} from "react";

type Meta = {
  title: string | null;
  coverUrl: string | null;
};

// jsmediatags の結果から objectURL を作る
const pictureToObjectUrl = (picture: {data: number[] | Uint8Array; format: string}): string => {
  const bytes = picture.data instanceof Uint8Array ? picture.data : new Uint8Array(picture.data);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const blob = new Blob([bytes], {type: picture.format}); // format は image/jpeg 等 :contentReference[oaicite:2]{index=2}
  return URL.createObjectURL(blob); // :contentReference[oaicite:3]{index=3}
};

const readMetaFromFile = (file: File): Promise<Meta> =>
  new Promise((resolve) => {
    jsmediatags.read(file, {
      onSuccess: (result) => {
        const tags = (result as any).tags ?? {};
        const title = typeof tags.title === "string" && tags.title.trim() ? tags.title.trim() : null;

        const picture = tags.picture as {data: number[] | Uint8Array; format: string} | undefined;
        const coverUrl = picture ? pictureToObjectUrl(picture) : null;

        resolve({title, coverUrl});
      },
      onError: () => resolve({title: null, coverUrl: null}),
    });
  });

const loadMetas = async (
  entries: Mp3Entry[],
  onMeta: (path: string, meta: Meta) => void
) => {
  const concurrency = 2; // 画像があるので控えめ
  const queue = [...entries];

  const worker = async () => {
    while (queue.length > 0) {
      const entry = queue.shift();
      if (!entry) return;

      const file = await entry.fileHandle.getFile();
      const meta = await readMetaFromFile(file);
      onMeta(entry.path, meta);
    }
  };

  await Promise.all(Array.from({length: concurrency}, worker));
};

type AlbumMetaByPath = Record<string, {album: string | null; trackNo: number | null; trackTotal: number | null}>;

const loadAlbumMetas = async (
  entries: Mp3Entry[],
  onMeta: (path: string, meta: {album: string | null; trackNo: number | null; trackTotal: number | null}) => void
) => {
  const concurrency = 3;
  const queue = [...entries];

  const worker = async () => {
    while (queue.length > 0) {
      const entry = queue.shift();
      if (!entry) return;

      const file = await entry.fileHandle.getFile();
      const meta = await readId3v2Basic(file);
      onMeta(entry.path, meta);
    }
  };

  await Promise.all(Array.from({length: concurrency}, worker));
};
export default function Page() {
  const [mp3List, setMp3List] = useState<Mp3Entry[]>([]);
  const [folderName, setFolderName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [titleByPath, setTitleByPath] = useState<Record<string, string | null>>({});
  const [coverUrlByPath, setCoverUrlByPath] = useState<Record<string, string | null>>({});

  // objectURL を revoke するために保持
  const coverUrlRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    return () => {
      // unmount 時に全部掃除
      for (const url of coverUrlRef.current.values()) {
        URL.revokeObjectURL(url);
      }
      coverUrlRef.current.clear();
    };
  }, []);

  const totalSize = useMemo(
    () => mp3List.reduce((sum, item) => sum + item.size, 0),
    [mp3List]
  );

  const onPickFolder = async () => {
    setErrorMessage("");
    setMp3List([]);
    setFolderName("");
    setTitleByPath({});

    // 既存 objectURL を掃除
    for (const url of coverUrlRef.current.values()) URL.revokeObjectURL(url);
    coverUrlRef.current.clear();
    setCoverUrlByPath({});

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

      // タイトル＆ジャケットを後から埋める
      void loadMetas(items, (path, meta) => {
        setTitleByPath((prev) => ({...prev, [path]: meta.title}));

        if (meta.coverUrl) {
          // 既存があれば revoke
          const prevUrl = coverUrlRef.current.get(path);
          if (prevUrl) URL.revokeObjectURL(prevUrl);

          coverUrlRef.current.set(path, meta.coverUrl);
          setCoverUrlByPath((prev) => ({...prev, [path]: meta.coverUrl}));
        } else {
          setCoverUrlByPath((prev) => ({...prev, [path]: null}));
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message);
    }
  };


  return (
    <main style={{padding: 16, maxWidth: 900, margin: "0 auto"}}>
      <h1 style={{fontSize: 22, fontWeight: 700}}>MP3曲情報エディター（テスト）</h1>

      <div style={{display: "flex", gap: 12, alignItems: "center", marginTop: 12}}>
        <button onClick={onPickFolder} style={{padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc"}}>
          フォルダを選ぶ
        </button>
        {folderName ? <div>選択中: <b>{folderName}</b></div> : <div>未選択</div>}
      </div>

      {errorMessage ? <p style={{marginTop: 12, color: "crimson"}}>エラー: {errorMessage}</p> : null}

      <div style={{marginTop: 16}}>
        <div style={{display: "flex", gap: 16}}>
          <div>MP3件数: <b>{mp3List.length}</b></div>
          <div>合計サイズ: <b>{(totalSize / (1024 * 1024)).toFixed(2)} MB</b></div>
        </div>

        <ul style={{marginTop: 12, paddingLeft: 0, listStyle: "none"}}>
          {mp3List.map((item) => {
            const title = titleByPath[item.path];
            const coverUrl = coverUrlByPath[item.path];

            return (
              <li key={item.path} style={{display: "flex", gap: 10, alignItems: "center", padding: "6px 0"}}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    overflow: "hidden",
                    display: "grid",
                    placeItems: "center",
                    background: "#fafafa",
                    flex: "0 0 auto",
                  }}
                >
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt=""
                      width={44}
                      height={44}
                      style={{width: "100%", height: "100%", objectFit: "cover"}}
                    />
                  ) : (
                    <span style={{fontSize: 12, opacity: 0.6}}>No Art</span>
                  )}
                </div>

                <div style={{minWidth: 0}}>
                  <div style={{fontWeight: 700}}>
                    {title ?? "（曲名取得中/なし）"}
                  </div>
                  <div style={{fontSize: 12, opacity: 0.8, wordBreak: "break-all"}}>
                    {item.path}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
