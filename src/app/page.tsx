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
    needsReconnect,
    savedHandle,
    reconnect,
    forget,
    mp3List,
    folderName,
    errorMessage,
    metaByPath,
    coverUrlByPath,
    dirCoverUrlByDir,
    pickFolderAndLoad,
  } = useMp3Library();

  const {mappingByPrefixId, error: mappingError, isLoading: mappingLoading} = useFantiaMapping();

  const {audioRef, nowPlaying, playEntry, stop} = useAudioPlayer();

  const trackViews = useTrackViews({
    mp3List,
    metaByPath,
    coverUrlByPath,
    dirCoverUrlByDir,
    mappingByPrefixId,
  });

  const list = trackViews.map((t) => t.item);
  const getTitle = (entry: (typeof list)[number]) => {
    const found = trackViews.find((t) => t.item.path === entry.path);
    return found ? found.displayTitle : null;
  };
  const {settings} = useSettings();
  const {
    playAtIndex,
    playNext,
    playPrev,
    stopAndReset,
  } = usePlaylistPlayer({
    audioRef,
    playEntry,
    stop,
    list,
    getTitle,
    resetKey: folderName, // フォルダ切替でindexリセット
    isContinuous: settings.playback.continuous,
    isShuffle: settings.playback.shuffle,
  });

  return (
    <AppShell
      header={
        <TopBar
          title="MP3曲情報エディター"
          folderName={folderName}
          savedHandle={savedHandle}
          needsReconnect={needsReconnect}
          pickFolderAndLoadAction={pickFolderAndLoad}
          reconnectAction={reconnect}
          forgetAction={forget}
        />
      }
      sidebar={<SidebarStub/>}
      main={
        <>
          {errorMessage ? <p style={{color: "crimson"}}>エラー: {errorMessage}</p> : null}
          {mappingError ? <p style={{color: "crimson"}}>対応表エラー: {mappingError}</p> : null}
          {mappingLoading ? <p style={{opacity: 0.7}}>対応表読み込み中…</p> : null}

          <TrackList
            trackViews={trackViews}
            onPlayAtIndexAction={playAtIndex}
            nowPlayingPath={nowPlaying?.path ?? null}
          />
        </>
      }
      player={
        <NowPlayingPanel
          nowPlaying={nowPlaying}
          trackViews={trackViews}
          audioRef={audioRef}
          playPrevAction={playPrev}
          playNextAction={playNext}
          stopAndResetAction={stopAndReset}
        />
      }
    />
  );
}
