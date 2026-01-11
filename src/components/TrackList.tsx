"use client";

import {EmptyStateFolderActions}       from "@/components/EmptyStateFolderActions";
import {useSettings}                   from "@/components/Settings/SettingsProvider";
import {TrackRow}                      from "@/components/TrackRow";
import {PlayActions}                   from "@/types/actions";
import {SettingAction}                 from "@/types/setting";
import {TrackView}                     from "@/types/views";
import React, {JSX, useEffect, useRef} from "react";

/**
 * トラックリストコンポーネントのプロパティを表します。
 */
type TrackListProps = {
  trackViews: readonly TrackView[];
  playActions: PlayActions;
  nowPlayingID: number;
  isPlaying: boolean;
  settingAction: SettingAction
};

/**
 * トラックリストコンポーネントをレンダリングし、トラックの一覧を表示します。各トラックには、タイトル、アルバム、オリジナルアーティスト、ファイルパスなどの詳細情報が含まれます。
 * トラックを再生するためのインタラクティブな要素を備え、現在再生中のトラックをハイライト表示します。
 *
 * @param {TrackListProps} props - TrackList コンポーネントに渡されるプロパティ。
 * @param {Array} props.trackViews - 表示する各トラックの詳細を含むトラックビューオブジェクトの配列。
 * @param {Object} props.playActions - 特定のインデックスでトラックを再生するなど、再生アクション用の関数を格納したオブジェクト。
 * @param {string | null} props.nowPlayingID - 現在再生中のトラックのID。リスト内でハイライト表示するために使用されます。
 *
 * @return {JSX.Element} トラックの一覧とその詳細情報を表示するレンダリング済み TrackList コンポーネント。
 */
export function TrackList(props: TrackListProps): JSX.Element {
  const {trackViews, playActions, nowPlayingID, isPlaying, settingAction} = props;

  const nowRowRef = useRef<HTMLTableRowElement | null>(null);

  const getScrollBehavior = (): ScrollBehavior => {
    // 省エネ設定の人は auto
    if (typeof window === "undefined") return "auto";
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ? "auto" : "smooth";
  };

  const {settings} = useSettings();

  const showFilePath = settings.ui.showFilePath;

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

  return !settingAction.folderName ? (
    <EmptyStateFolderActions settingAction={settingAction}/>
  ) : trackViews.length === 0 ?
    <>読み込み中</>
    :(
    <section>
      <div
        data-scroll="song-list"
        style={{
          maxWidth: "100%",
          overflowX: showFilePath ? "auto" : "hidden",
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
              <col key="action" style={{width: 32}}/>,
              <col key="no" style={{width: 28}}/>,
              <col key="art" style={{width: 28}}/>,
              // ✅ ここが肝：曲名は width 指定しない（余りを全部吸う）
              <col key="title"/>,

              // ✅ 右側は “狭い時は縮む / 広い時は広がりすぎない” clamp が強い
              <col key="ym" style={{width: "clamp(80px, 9vw, 120px)"}}/>,
              <col key="orig" style={{width: "clamp(60px, 9vw, 100px)"}}/>,

              ...(showFilePath ? [<col key="path" style={{width: 260}}/>] : []),
            ]}
          </colgroup>

          <thead>
          <tr style={{borderBottom: "1px solid var(--list-border)"}}>
            <th style={{...thStyle, textAlign: "right"}}></th>
            <th style={thStyle}>#</th>
            <th style={thStyle} aria-label="ジャケット"/>
            <th style={thStyle}>曲名</th>
            <th style={thStyle}>アルバム</th>
            <th style={thStyle}>原曲</th>
            {showFilePath ? <th style={thStyle}>ファイル</th> : null}
          </tr>
          </thead>

          <tbody>
          {trackViews.map((t, index) =>
            <TrackRow
              key={index}
              view={t}
              index={index}
              isActive={nowPlayingID === t.item.id}
              isPlaying={isPlaying}
              onPlay={playActions.playAtIndex}
            />)}
          </tbody>

        </table>
      </div>
    </section>
  );
}

/**
 * テーブルヘッダー（th）要素に適用されるスタイルを表します。
 * パディング、フォントサイズ、フォントウェイト、不透明度、テキスト配置、および空白処理に関するCSSプロパティを含みます。
 */
const thStyle: React.CSSProperties = {
  padding: "2px 6px",
  fontSize: 11,
  fontWeight: 800,
  opacity: 0.85,
  textAlign: "left",
  whiteSpace: "nowrap",
};
