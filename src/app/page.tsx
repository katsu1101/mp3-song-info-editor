"use client";

import {AppShell}          from "@/components/AppShell/AppShell";
import {NowPlayingPanel}   from "@/components/NowPlayingPanel";
import {useSettings}       from "@/components/Settings/SettingsProvider";
import {SidebarStub}       from "@/components/Sidebar";
import {TopBar}            from "@/components/TopBar";
import {TrackList}         from "@/components/TrackList";
import {useAudioPlayer}    from "@/hooks/useAudioPlayer";
import {useFantiaMapping}  from "@/hooks/useFantiaMapping";
import {useMp3Library}     from "@/hooks/useMp3Library";
import {usePlaylistPlayer} from "@/hooks/usePlaylistPlayer";
import {useTrackViews}     from "@/hooks/useTrackViews";

export default function Page() {
  const {
    mp3List,
    covers,
    settingAction,
  } = useMp3Library();

  const {mappingByPrefixId, error: mappingError, isLoading: mappingLoading} = useFantiaMapping();

  const {audioRef, nowPlayingID, playEntry} = useAudioPlayer();
  const metaByPath = settingAction.metaByPath
  const trackViews = useTrackViews({
    mp3List,
    metaByPath,
    covers,
    mappingByPrefixId,
  });

  const list = trackViews.map((t) => t.item);

  const {settings} = useSettings();
  const {
    playActions,
  } = usePlaylistPlayer({
    audioRef,
    playEntry,
    list,
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
