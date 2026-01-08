import {TrackView}                                      from "@/hooks/useTrackViews";
import {isTypingTarget}                                 from "@/lib/dom/isTypingTarget";
import {Settings}                                       from "@/lib/settings/settings";
import type {Mp3Entry}                                  from "@/types";
import React, {useCallback, useEffect, useMemo, useRef} from "react";

type UsePlaylistPlayerArgs = {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  playEntry: (entry: Mp3Entry, title: string | null) => Promise<void>;

  trackViews: TrackView[]; // 連続再生の並び順確定済み
  resetKey?: string; // フォルダ変更などでリセットしたい時に渡す
  settings: Settings
};

export type PlayActions = {
  playAtIndex: (index: number) => Promise<void>;
  playNext: () => Promise<void>;
  playPrev: () => Promise<void>;
}

export const usePlaylistPlayer = (args: UsePlaylistPlayerArgs) => {
  const {audioRef, playEntry, trackViews, resetKey, settings} = args;

  const currentIndexRef = useRef<number | null>(null);

  const isContinuousRef = useRef<boolean>(true);
  const isShuffleRef = useRef<boolean>(false);

  useEffect(() => {
    isContinuousRef.current = settings.playback.continuous;
    isShuffleRef.current = settings.playback.shuffle;
  }, [settings]);

  const playAtIndex = useCallback(
    async (index: number): Promise<void> => {
      if (index < 0 || index >= trackViews.length) return;

      const entry = trackViews[index];
      const title = entry.item.name;

      currentIndexRef.current = index;
      await playEntry(entry.item, title);
    },
    [trackViews, playEntry]
  );

  const playNext = useCallback(async (): Promise<void> => {
    const index = currentIndexRef.current;
    if (index === null) return;

    // ✅ 通常
    await playAtIndex(index + 1);
  }, [playAtIndex]);

  const playPrev = useCallback(async (): Promise<void> => {
    const index = currentIndexRef.current;
    if (index === null) return;

    // ✅ 通常
    await playAtIndex(index - 1);
  }, [playAtIndex]);

  // audio ended → 次へ（連続再生ON時）
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      if (!isContinuousRef.current) return;
      void playNext();
    };

    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [audioRef, playNext]);

  // resetKey（フォルダ変更など）でプレイリスト位置をリセット
  useEffect(() => {
    if (resetKey === undefined) return;
    currentIndexRef.current = null;
  }, [resetKey]);

  // キーボードショートカット
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.repeat) return;

      const audio = audioRef.current;
      if (!audio) return;

      if (event.code === "Space") {
        event.preventDefault();

        const hasSource = audio.currentSrc.length > 0;

        if (!audio.paused) {
          audio.pause();
          return;
        }

        if (hasSource) {
          if (audio.ended) audio.currentTime = 0;
          void audio.play();
          return;
        }

        if (trackViews.length > 0) void playAtIndex(0);
        return;
      }

      if (event.code === "ArrowRight") {
        event.preventDefault();
        void playNext();
        return;
      }

      if (event.code === "ArrowLeft") {
        event.preventDefault();
        void playPrev();
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown, {passive: false});
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [audioRef, trackViews.length, playAtIndex, playNext, playPrev]);

  return useMemo(
    () => ({
      playActions: {
        playAtIndex,
        playNext,
        playPrev,
      } as PlayActions
    }),
    [playAtIndex, playNext, playPrev]
  );
};