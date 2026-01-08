"use client";

import {useSettings}              from "@/components/Settings/SettingsProvider";
import {PlayActions}              from "@/hooks/usePlaylistPlayer";
import {TrackView}                from "@/hooks/useTrackViews";
import Image                      from "next/image";
import React, {useEffect, useRef} from "react";

type TrackListProps = {
  trackViews: readonly TrackView[];
  playActions: PlayActions;
  nowPlayingID: number;
};

export function TrackList(props: TrackListProps) {
  const {trackViews, playActions, nowPlayingID} = props;

  const nowRowRef = useRef<HTMLTableRowElement | null>(null);

  const getScrollBehavior = (): ScrollBehavior => {
    // 省エネ設定の人は auto
    if (typeof window === "undefined") return "auto";
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ? "auto" : "smooth";
  };

  const {settings} = useSettings();

  const showFilePath = settings.ui.showFilePath;

  const THUMB = 20;

  useEffect(() => {
    if (!nowPlayingID) return;
    const row = nowRowRef.current;
    if (!row) return;

    row.scrollIntoView({
      behavior: getScrollBehavior(),
      block: "nearest",
      inline: "nearest",
    });
  }, [nowPlayingID]);

  return (
    <section style={{marginTop: 12}}>

      {trackViews.length === 0 ? (
        <p style={{marginTop: 10, opacity: 0.7, fontSize: 13}}>曲がありません（フォルダを選択してください）</p>
      ) : (
        <div
          style={{
            marginTop: 8,
            maxWidth: "100%",
            overflowX: showFilePath ? "auto" : "hidden", // ✅ 普段ははみ出させない
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              tableLayout: "fixed",
            }}
          >
            <colgroup>
              {[
                <col key="no" style={{width: 28}}/>,
                <col key="art" style={{width: 28}}/>,
                <col key="action" style={{width: 32}}/>,
                // ✅ ここが肝：曲名は width 指定しない（余りを全部吸う）
                <col key="title"/>,

                // ✅ 右側は “狭い時は縮む / 広い時は広がりすぎない” clamp が強い
                <col key="ym" style={{width: "clamp(80px, 9vw, 120px)"}}/>,
                <col key="orig" style={{width: "clamp(60px, 9vw, 100px)"}}/>,

                ...(showFilePath ? [<col key="path" style={{width: 260}}/>] : []),
              ]}
            </colgroup>


            <thead>
            <tr style={{borderBottom: "1px solid rgba(255,255,255,0.10)"}}>
              <th style={thStyle}>#</th>
              <th style={thStyle} aria-label="ジャケット"/>
              <th style={{...thStyle, textAlign: "right"}}>再生</th>
              <th style={thStyle}>曲名</th>
              <th style={thStyle}>アルバム</th>
              <th style={thStyle}>原曲</th>
              {showFilePath ? <th style={thStyle}>ファイル</th> : null}
            </tr>
            </thead>

            <tbody>
            {trackViews.map((t) => {
              const isNowPlaying = nowPlayingID === t.item.id;
              const releaseText = t.orderLabel;
              const originalText = t.originalArtist ?? "";

              return (
                <tr
                  key={t.item.path}
                  ref={(el) => {
                    if (isNowPlaying) nowRowRef.current = el;
                  }}
                  aria-current={isNowPlaying ? "true" : undefined}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    height: 24,
                    background: isNowPlaying ? "rgba(255,255,255,0.06)" : "transparent",
                    transition: "background 120ms ease",
                    // ✅ ヘッダーに隠れやすい場合はここを増やす
                    scrollMarginTop: 80,
                  }}
                >
                  <td>{t.item.id}</td>
                  {/* art */}
                  <td
                    style={{
                      ...tdStyle,
                      padding: 0,
                      borderLeft: isNowPlaying ? "3px solid rgba(255,255,255,0.65)" : "3px solid transparent",
                    }}
                  >
                    <div
                      style={{
                        width: THUMB,
                        height: THUMB,
                        borderRadius: 8,
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.06)",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      {t.coverUrl ? (
                        <Image
                          src={t.coverUrl}
                          alt=""
                          width={THUMB}
                          height={THUMB}
                          unoptimized
                          style={{width: "100%", height: "100%", objectFit: "cover"}}
                        />
                      ) : (
                        <span style={{fontSize: 10, opacity: 0.6}}>No</span>
                      )}
                    </div>
                  </td>

                  {/* action */}
                  <td style={{...tdStyle, padding: 0}}>
                    <div style={{display: "grid", placeItems: "center"}}>
                      <button
                        onClick={() => void playActions.playAtIndex(t.index)}
                        style={{
                          height: 20,
                          width: 28,
                          padding: 0,
                          borderRadius: 999,
                          border: isNowPlaying
                            ? "1px solid rgba(255,255,255,0.40)"
                            : "1px solid rgba(255,255,255,0.18)",
                          background: isNowPlaying ? "rgba(255,255,255,0.10)" : "transparent",
                          color: "white",
                          fontWeight: 800,
                          lineHeight: "20px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="この曲を再生"
                      >
                        ▶
                      </button>
                    </div>
                  </td>

                  {/* title */}
                  <td style={tdStyle}>
                    <div style={oneLine15} title={t.displayTitle}>
                      {t.displayTitle}
                    </div>
                  </td>

                  {/* releaseOrder */}
                  <td style={tdStyle}>
                    <div style={oneLine12} title={releaseText}>
                      {releaseText}
                    </div>
                  </td>

                  {/* originalArtist */}
                  <td style={tdStyle}>
                    <div style={oneLine12} title={originalText}>
                      {originalText || "—"}
                    </div>
                  </td>

                  {/* path (optional) */}
                  {showFilePath ? (
                    <td style={tdStyle}>
                      <div style={oneLine11dim} title={t.item.path}>
                        {t.item.path}
                      </div>
                    </td>
                  ) : null}

                </tr>
              );
            })}
            </tbody>

          </table>
        </div>
      )}
    </section>
  );
}

const thStyle: React.CSSProperties = {
  padding: "2px 6px",
  fontSize: 11,
  fontWeight: 800,
  opacity: 0.85,
  textAlign: "left",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "0 6px",
  verticalAlign: "middle",
  lineHeight: "24px",      // ✅ 行高に吸着させる
};

const oneLine15: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 900,
  lineHeight: "24px",      // ✅ ここも吸着
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const oneLine12: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.75,
  lineHeight: 1.1,           // ✅ 行間を締める
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const oneLine11dim: React.CSSProperties = {
  fontSize: 11,
  opacity: 0.55,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
