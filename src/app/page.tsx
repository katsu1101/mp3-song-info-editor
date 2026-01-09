"use client";

import {AppShell}                         from "@/components/AppShell/AppShell";
import {NowPlayingPanel}                  from "@/components/NowPlayingPanel";
import {useSettings}                      from "@/components/Settings/SettingsProvider";
import {SidebarStub}                      from "@/components/Sidebar";
import {TopBar}                           from "@/components/TopBar";
import {TrackList}                        from "@/components/TrackList";
import {useAudioPlayer}                   from "@/hooks/useAudioPlayer";
import {useFantiaMapping}                 from "@/hooks/useFantiaMapping";
import {useMp3Library, useOrderedMp3List} from "@/hooks/useMp3Library";
import {usePlaylistPlayer}                from "@/hooks/usePlaylistPlayer";
import {useTrackViews}                    from "@/hooks/useTrackViews";
import React, {JSX}                       from "react";

/**
 * MP3トラック情報エディタのメインページを表すReact関数コンポーネント。
 * トラックリストの並べ替え、シャッフル設定、再生コントロール、外部リソースとの連携など、様々な機能を処理します。
 * ページはトップバー、サイドバー、メインコンテンツ、プレイヤーコンポーネントで構成されています。
 *
 * @return {JSX.Element} ヘッダー、サイドバー、メインコンテンツ、プレイヤーセクションを含む、アプリケーションのレンダリング済みコンポーネント構造。
 */
export default function Page(): JSX.Element {

  const {settings} = useSettings();

  // covers が何度変わっても、曲順は変えないために「曲順トリガー」を分離する
  const [shuffleVersion] = React.useState(0);

  const {
    mp3List,
    covers,
    settingAction,
  } = useMp3Library(settings.playback.shuffle);

  const orderedMp3List = useOrderedMp3List(
    mp3List,
    settings.playback.shuffle,
    shuffleVersion
  );

  const {mappingByPrefixId, error: mappingError, isLoading: mappingLoading} = useFantiaMapping();

  const {audioRef, nowPlayingID, playEntry} = useAudioPlayer();
  const metaByPath = settingAction.metaByPath
  const trackViews = useTrackViews({
    mp3List: orderedMp3List,
    metaByPath,
    covers,
    mappingByPrefixId,
  });

  const {
    playActions,
  } = usePlaylistPlayer({
    audioRef,
    playEntry,
    trackViews,
    resetKey: settingAction.folderName, // フォルダ切替でindexリセット
    settings,
  });

  return (
    <AppShell
      header={
        <TopBar
          title="MP3曲情報エディター"
          settingAction={settingAction}
        />
      }
      sidebar={<SidebarStub/>}
      main={
        <>
          {settingAction.errorMessage
            ? <p style={{color: "crimson"}}>エラー: {settingAction.errorMessage}</p>
            : null}
          {mappingError ? <p style={{color: "crimson"}}>対応表エラー: {mappingError}</p> : null}
          {mappingLoading ? <p style={{opacity: 0.7}}>対応表読み込み中…</p> : null}

          <TrackList
            trackViews={trackViews}
            playActions={playActions}
            nowPlayingID={nowPlayingID}
          />
        </>
      }
      player={
        <NowPlayingPanel
          nowPlayingID={nowPlayingID}
          trackViews={trackViews}
          audioRef={audioRef}
          playActions={playActions}
        />
      }
    />
  );
}
