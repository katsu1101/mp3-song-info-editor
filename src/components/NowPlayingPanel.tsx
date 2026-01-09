"use client";


import {PlayActions}                              from "@/types/actions";
import {TrackView}                                from "@/types/views";
import Image                                      from "next/image";
import React, {JSX, useEffect, useMemo, useState} from "react";

/**
 * NowPlayingPanel コンポーネントに必要なプロパティを表します。
 */
type NowPlayingPanelProps = {
  nowPlayingID: number;
  trackViews: readonly TrackView[];
  audioRef: React.RefObject<HTMLAudioElement | null>;
  playActions: PlayActions;
};

/**
 * 指定されたファイルパスからベース名（最後の部分）を抽出します。
 *
 * この関数はファイルパスをパラメータとして受け取り、ディレクトリ区切り文字「/」で構成要素に分割し、パスの最後のセグメントを返します。
 * 渡されたパスに有効なセグメントが含まれていない場合、元のパスが返されます。
 *
 * @param {string} path - ベース名を抽出するファイルパス。
 * @returns {string} ベース名、または有効なセグメントが見つからない場合は元のパス。
 */
const getBasename = (path: string): string => {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? path;
};

/**
 * 指定されたファイルパスからディレクトリ名を抽出して返します。
 *
 * この関数は、ファイルパスを表す文字列を受け取り、ファイル名または指定されたパスの最後のセグメントを除去することで親ディレクトリを返します。
 * パスが単一のセグメントのみを含む場合、または空の場合、空の文字列が返されます。
 *
 * @param {string} path - ディレクトリ名を抽出するファイルパス。
 * @returns {string} パスから抽出されたディレクトリ名。パスに親ディレクトリが含まれていない場合は空文字列。
 */
const getDirname = (path: string): string => {
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 1) return "";
  return parts.slice(0, -1).join("/");
};

/**
 * 現在再生中のトラック情報を表示し、再生、一時停止、スキップ、前のトラックボタンなどの再生コントロールを提供する
 * 「再生中」パネルとして機能するReactコンポーネント。
 *
 * @param {Object} props - このコンポーネントに必要なプロパティ。
 * @param {string} props.nowPlayingID - 現在再生中のトラックのID。
 * @param {Array} props.trackViews - 各トラックの詳細を含むトラックビューオブジェクトのリスト。
 * @param {Object} props.audioRef - オーディオ再生に使用される HTMLAudioElement を指す React ref オブジェクト。
 * @param {Object} props.playActions - 再生コントロール用のアクション（例: playPrev, playNext）を含むオブジェクト。
 * @return {JSX.Element} 「再生中」パネルをレンダリングする JSX Element。
 */
export function NowPlayingPanel(props: NowPlayingPanelProps): JSX.Element {
  const {
    nowPlayingID,
    trackViews,
    audioRef,
    playActions,
  } = props;

  const nowTrackView = useMemo(() => {
    if (!nowPlayingID) return null;
    return trackViews.find((t) => t.item.id === nowPlayingID) ?? null;
  }, [nowPlayingID, trackViews]);

  const title = nowTrackView?.displayTitle ?? "";

  const filePath = nowTrackView?.item.path;
  const fileName = filePath ? getBasename(filePath) : "—";
  const dirName = filePath ? getDirname(filePath) : "";

  const canControl = Boolean(nowTrackView?.item);

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
          {nowTrackView?.coverUrl ? (
            <Image
              src={nowTrackView?.coverUrl}
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
            onClick={() => void playActions.playPrev()}
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
            onClick={() => void playActions.playNext()}
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
        <InfoRow label="年月/順" value={nowTrackView?.orderLabel ?? "—"}/>
        <InfoRow label="原曲" value={nowTrackView?.originalArtist ?? "—"}/>
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

/**
 * ラベルと値を持つ情報の行を表示する機能コンポーネント。
 *
 * @param {Object} props - プロパティオブジェクト。
 * @param {string} props.label - 表示するラベルテキスト。
 * @param {string} props.value - 表示する値テキスト。
 * @return {JSX.Element} ラベルと値を含むスタイル付き行。
 */
function InfoRow(props: { label: string; value: string }): JSX.Element {
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
