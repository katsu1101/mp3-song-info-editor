"use client";

import {AppShell}          from "@/components/AppShell/AppShell";
import {NowPlayingPanel}   from "@/components/NowPlayingPanel";
import {SidebarStub}       from "@/components/Sidebar";
import {TopBar}            from "@/components/TopBar";
import {TrackList}         from "@/components/TrackList";
import {useAudioPlayer}    from "@/hooks/useAudioPlayer";
import {useFantiaMapping}  from "@/hooks/useFantiaMapping";
import {useMp3Library}     from "@/hooks/useMp3Library";
import {usePlaylistPlayer} from "@/hooks/usePlaylistPlayer";
import {useTrackViews}     from "@/hooks/useTrackViews";
import {useState}          from "react";


export default function Page() {
  const {
    needsReconnect,
    savedHandle,
    reconnect,
    forget,
    mp3List,
    folderName,
    errorMessage,
    metaByPath,        // ✅ 追加（title/album/trackNo/artist 等は全部ここ）
    coverUrlByPath,
    dirCoverUrlByDir, // ✅ 追加
    pickFolderAndLoad,
  } = useMp3Library();

  const {mappingByPrefixId, error: mappingError, isLoading: mappingLoading} = useFantiaMapping();

  const [showFilePath, setShowFilePath] = useState<boolean>(false);

  const {audioRef, nowPlaying, playEntry, stop} = useAudioPlayer();

  const trackViews = useTrackViews({
    mp3List,
    metaByPath,        // ✅ ここだけでOK
    coverUrlByPath,
    dirCoverUrlByDir, // ✅ 渡す
    mappingByPrefixId,
  });

  const list = trackViews.map((t) => t.item);
  const getTitle = (entry: (typeof list)[number]) => {
    const found = trackViews.find((t) => t.item.path === entry.path);
    return found ? found.displayTitle : null;
  };

  const {
    isContinuous,
    toggleContinuous,
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
          showFilePath={showFilePath}
          setShowFilePathAction={setShowFilePath}

          // ✅ 追加
          isContinuous={isContinuous}
          toggleContinuousAction={toggleContinuous}
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
            showFilePath={showFilePath}
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
