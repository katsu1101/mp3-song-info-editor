"use client";

import {useAudioPlayer} from "@/hooks/useAudioPlayer";
import {useMp3Library}  from "@/hooks/useMp3Library";
import Image            from "next/image";

export default function Page() {
  const {
    mp3List,
    folderName,
    errorMessage,
    totalSize,
    titleByPath,
    coverUrlByPath,
    pickFolderAndLoad,
  } = useMp3Library();

  const {audioRef, nowPlaying, playEntry, stop} = useAudioPlayer();

  return (
    <main style={{padding: 16, maxWidth: 900, margin: "0 auto"}}>
      <h1 style={{fontSize: 22, fontWeight: 700}}>MP3曲情報エディター（テスト）</h1>

      <div style={{display: "flex", gap: 12, alignItems: "center", marginTop: 12, flexWrap: "wrap"}}>
        <button onClick={pickFolderAndLoad} style={{padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc"}}>
          フォルダを選ぶ
        </button>
        {folderName ? <div>選択中: <b>{folderName}</b></div> : <div>未選択</div>}
      </div>

      {errorMessage ? <p style={{marginTop: 12, color: "crimson"}}>エラー: {errorMessage}</p> : null}

      {/* プレイヤー */}
      <section style={{marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 10}}>
        <div style={{display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap"}}>
          <div style={{fontWeight: 700}}>再生</div>
          {nowPlaying ? (
            <div style={{opacity: 0.9}}>
              <b>{nowPlaying.title ?? "（曲名なし）"}</b>{" "}
              <span style={{fontSize: 12, opacity: 0.8}}>{nowPlaying.path}</span>
            </div>
          ) : (
            <div style={{opacity: 0.7}}>未再生</div>
          )}
          <button onClick={stop} style={{padding: "6px 10px", borderRadius: 8, border: "1px solid #ccc"}}>
            停止
          </button>
        </div>

        <div style={{marginTop: 10}}>
          <audio ref={audioRef} controls preload="none" style={{width: "100%"}}/>
        </div>
      </section>

      <div style={{marginTop: 16}}>
        <div style={{display: "flex", gap: 16}}>
          <div>MP3件数: <b>{mp3List.length}</b></div>
          <div>合計サイズ: <b>{(totalSize / (1024 * 1024)).toFixed(2)} MB</b></div>
        </div>

        <ul style={{marginTop: 12, paddingLeft: 0, listStyle: "none"}}>
          {mp3List.map((item) => {
            const title = titleByPath[item.path] ?? null;
            const coverUrl = coverUrlByPath[item.path];

            return (
              <li key={item.path} style={{display: "flex", gap: 10, alignItems: "center", padding: "6px 0"}}>
                <div style={{
                  width: 44, height: 44, borderRadius: 8, border: "1px solid #ddd",
                  overflow: "hidden", display: "grid", placeItems: "center",
                  background: "#fafafa", flex: "0 0 auto",
                }}>
                  {coverUrl ? (
                    <Image src={coverUrl} alt="" width={44} height={44}
                           style={{width: "100%", height: "100%", objectFit: "cover"}}/>
                  ) : (
                    <span style={{fontSize: 12, opacity: 0.6}}>No Art</span>
                  )}
                </div>

                <div style={{minWidth: 0, flex: "1 1 auto"}}>
                  <div style={{fontWeight: 700}}>{title ?? "（曲名取得中/なし）"}</div>
                  <div style={{fontSize: 12, opacity: 0.8, wordBreak: "break-all"}}>{item.path}</div>
                </div>

                <button
                  onClick={() => void playEntry(item, title)}
                  style={{padding: "6px 10px", borderRadius: 8, border: "1px solid #ccc", flex: "0 0 auto"}}
                >
                  ▶ 再生
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
