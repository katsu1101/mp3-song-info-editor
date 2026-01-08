import {isTypingTarget}                                 from "@/lib/dom/isTypingTarget";
import {Settings}                                       from "@/lib/settings/settings";
import type {Mp3Entry}                                  from "@/types";
import React, {useCallback, useEffect, useMemo, useRef} from "react";

type UsePlaylistPlayerArgs = {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  playEntry: (entry: Mp3Entry, title: string | null) => Promise<void>;

  list: Mp3Entry[]; // 連続再生の並び順確定済み
  resetKey?: string; // フォルダ変更などでリセットしたい時に渡す
  settings: Settings
};

export type PlayActions = {
  playAtIndex: (index: number) => Promise<void>;
  playNext: () => Promise<void>;
  playPrev: () => Promise<void>;
}

const randomInt = (maxExclusive: number): number => {
  if (maxExclusive <= 0) return 0;

  // crypto があればそれを優先（より安定）
  const cryptoObj: Crypto | undefined = (globalThis as unknown as { crypto?: Crypto }).crypto;
  if (cryptoObj?.getRandomValues) {
    const buf = new Uint32Array(1);
    cryptoObj.getRandomValues(buf);
    return buf[0]! % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
};

const shuffleArray = <T, >(items: readonly T[]): T[] => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
};

const buildShuffledQueue = (length: number, excludeIndex: number | null): number[] => {
  const indices: number[] = [];
  for (let i = 0; i < length; i++) {
    if (excludeIndex !== null && i === excludeIndex) continue;
    indices.push(i);
  }
  return shuffleArray(indices);
};

export const usePlaylistPlayer = (args: UsePlaylistPlayerArgs) => {
  const {audioRef, playEntry, list, resetKey, settings} = args;

  const currentIndexRef = useRef<number | null>(null);

  const isContinuousRef = useRef<boolean>(true);
  const isShuffleRef = useRef<boolean>(false);

  // シャッフル用：次に再生するキュー / 戻る用履歴
  const shuffleQueueRef = useRef<number[]>([]);
  const shuffleHistoryRef = useRef<number[]>([]);

  useEffect(() => {
    isContinuousRef.current = settings.playback.continuous;
    isShuffleRef.current = settings.playback.shuffle;
  }, [settings]);


  const syncShuffleQueue = useCallback(() => {
    if (!isShuffleRef.current) return;
    shuffleQueueRef.current = buildShuffledQueue(list.length, currentIndexRef.current);
    shuffleHistoryRef.current = [];
  }, [list.length]);

  const playAtIndex = useCallback(
    async (index: number): Promise<void> => {
      if (index < 0 || index >= list.length) return;

      const prevIndex = currentIndexRef.current;

      // シャッフル中：履歴とキューを整合
      if (isShuffleRef.current) {
        if (prevIndex !== null && prevIndex !== index) {
          shuffleHistoryRef.current = [...shuffleHistoryRef.current, prevIndex];
        }

        // キューから選択済みを除去（クリック再生でも重複しない）
        shuffleQueueRef.current = shuffleQueueRef.current.filter((i) => i !== index);

        // もしキューが空になったら、残りを再構築（「最後まで行ったら止まる」挙動を保つなら再構築しない）
        // 今回は “互換性優先” で「尽きたら止まる」に寄せるので、ここでは再構築しない。
      }

      const entry = list[index];
      const title = entry.name;

      currentIndexRef.current = index;
      await playEntry(entry, title);
    },
    [list, playEntry]
  );

  const playNext = useCallback(async (): Promise<void> => {
    const idx = currentIndexRef.current;
    if (idx === null) return;

    // ✅ シャッフルONならキューから
    if (isShuffleRef.current) {
      const nextIndex = shuffleQueueRef.current.shift();
      if (nextIndex === undefined) return; // これ以上なし（互換性：末尾で止まる）
      await playAtIndex(nextIndex);
      return;
    }

    // ✅ 通常
    await playAtIndex(idx + 1);
  }, [playAtIndex]);

  const playPrev = useCallback(async (): Promise<void> => {
    const idx = currentIndexRef.current;
    if (idx === null) return;

    // ✅ シャッフルONなら履歴から
    if (isShuffleRef.current) {
      const prevIndex = shuffleHistoryRef.current.pop();
      if (prevIndex === undefined) return;
      await playAtIndex(prevIndex);
      return;
    }

    // ✅ 通常
    await playAtIndex(idx - 1);
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
    shuffleQueueRef.current = [];
    shuffleHistoryRef.current = [];
  }, [resetKey]);

  // list が変わったら（曲数変動など）シャッフルキューを再生成
  useEffect(() => {
    if (!settings.playback.shuffle) return;
    syncShuffleQueue();
  }, [settings, syncShuffleQueue]);

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

        if (list.length > 0) void playAtIndex(0);
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
  }, [audioRef, list.length, playAtIndex, playNext, playPrev]);

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