"use client";

import {TrackView}                           from "@/hooks/useTrackViews";
import Image                                 from "next/image";
import React, {useEffect, useMemo, useState} from "react";

type NowPlayingInfo = {
  title: string | null;
  path: string;
};

type NowPlayingPanelProps = {
  nowPlaying: NowPlayingInfo | null;
  trackViews: readonly TrackView[];

  audioRef: React.RefObject<HTMLAudioElement | null>;

  playPrevAction: () => Promise<void> | void;
  playNextAction: () => Promise<void> | void;

  stopAndResetAction: () => void;
};

const getBasename = (path: string): string => {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? path;
};

const getDirname = (path: string): string => {
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 1) return "";
  return parts.slice(0, -1).join("/");
};

export function NowPlayingPanel(props: NowPlayingPanelProps) {
  const {
    nowPlaying,
    trackViews,
    audioRef,
    playPrevAction,
    playNextAction,
  } = props;

  const nowTrackView = useMemo(() => {
    if (!nowPlaying) return null;
    return trackViews.find((t) => t.item.path === nowPlaying.path) ?? null;
  }, [nowPlaying, trackViews]);

  const title = nowTrackView?.displayTitle ?? nowPlaying?.title ?? "未再生";
  const coverUrl = nowTrackView?.coverUrl ?? null;

  const releaseOrder = nowTrackView?.orderLabel ?? "—";
  const originalArtist = nowTrackView?.originalArtist ?? "—";

  const filePath = nowPlaying?.path ?? "";
  const fileName = filePath ? getBasename(filePath) : "—";
  const dirName = filePath ? getDirname(filePath) : "";

  const canControl = Boolean(nowPlaying);

  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const sync = () => setIsPlaying(!audio.paused && !audio.ended);

    sync();
    audio.addEventListener("play", sync);
    audio.addEventListener("pause", sync);
    audio.addEventListener("ended", sync);

    return () => {
      audio.removeEventListener("play", sync);
      audio.removeEventListener("pause", sync);
      audio.removeEventListener("ended", sync);
    };
  }, [audioRef]);

  const togglePlayPauseLikeSpace = async () => {
    if (!canControl) return;

    const audio = audioRef.current;
    if (!audio) return;

    // Space と同じ：止める＝pause、再開＝play（currentTime は触らない）
    if (audio.paused || audio.ended) {
      try {
        await audio.play();
      } catch {
        // 自動再生制限など。クリック操作なら通常OKだが念のため握りつぶし
      }
      return;
    }

    audio.pause();
  };

  const COVER_MAX = 280;

  return (
    <section
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(0,0,0,0.22)",
        overflowX: "hidden",
        maxWidth: "100%",
      }}
    >
      {/* ジャケ（上） */}
      <div style={{display: "grid", placeItems: "center"}}>
        <div
          style={{
            width: "100%",
            maxWidth: COVER_MAX,
            aspectRatio: "1 / 1",
            borderRadius: 18,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            display: "grid",
            placeItems: "center",
          }}
        >
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt=""
              width={COVER_MAX}
              height={COVER_MAX}
              unoptimized
              style={{width: "100%", height: "100%", objectFit: "cover"}}
            />
          ) : (
            <span style={{fontSize: 12, opacity: 0.7}}>No Art</span>
          )}
        </div>
      </div>

      {/* タイトル行：左=曲名、右=◀ 停止/再生 ▶ */}
      <div
        style={{
          marginTop: 10,
          display: "flex",
          alignItems: "center",
          gap: 10,
          minWidth: 0,
        }}
      >
        <div
          style={{
            minWidth: 0,
            fontSize: 16,
            fontWeight: 900,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={title}
        >
          {title}
        </div>

        <div style={{marginLeft: "auto", display: "flex", alignItems: "center", gap: 10}}>
          <button
            onClick={() => void playPrevAction()}
            disabled={!canControl}
            style={miniIconButtonStyle(!canControl)}
            title="前へ"
          >
            ⏮
          </button>

          <button
            onClick={() => void togglePlayPauseLikeSpace()}
            disabled={!canControl}
            style={miniIconButtonStyle(!canControl)}
            title={isPlaying ? "一時停止" : "再生"}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>

          <button
            onClick={() => void playNextAction()}
            disabled={!canControl}
            style={miniIconButtonStyle(!canControl)}
            title="次へ"
          >
            ⏭
          </button>
        </div>
      </div>

      {/* audio：タイトル行のすぐ下 */}
      <div style={{marginTop: 10}}>
        <audio ref={audioRef} controls preload="none" style={{width: "100%"}}/>
      </div>

      {/* 情報（縦） */}
      <div style={{marginTop: 12, display: "grid", gap: 6}}>
        <InfoRow label="年月/順" value={releaseOrder}/>
        <InfoRow label="原曲" value={originalArtist}/>
        <InfoRow label="ファイル" value={fileName}/>
        {dirName ? <InfoRow label="フォルダ" value={dirName}/> : null}
      </div>

      {/* パス（折りたたみ） */}
      {filePath ? (
        <details style={{marginTop: 10}}>
          <summary style={{cursor: "pointer", fontSize: 12, opacity: 0.7}}>パス</summary>
          <div style={{fontSize: 11, opacity: 0.6, marginTop: 6, wordBreak: "break-all"}}>
            {filePath}
          </div>
        </details>
      ) : null}
    </section>
  );
}

function InfoRow(props: { label: string; value: string }) {
  const {label, value} = props;
  return (
    <div style={{display: "grid", gridTemplateColumns: "72px 1fr", gap: 10, minWidth: 0}}>
      <div style={{fontSize: 11, opacity: 0.55, whiteSpace: "nowrap"}}>{label}</div>
      <div
        style={{
          fontSize: 12,
          opacity: 0.85,
          minWidth: 0,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}

function miniIconButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    width: 44,
    height: 34,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "transparent",
    color: "white",
    fontWeight: 900,
    opacity: disabled ? 0.45 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
    display: "grid",
    placeItems: "center",
    lineHeight: 1,
  };
}
