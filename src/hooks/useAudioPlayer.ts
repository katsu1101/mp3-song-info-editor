"use client";

import type {Mp3Entry}    from "@/types/mp3Entry";
import {useRef, useState} from "react";

/**
 * オーディオプレーヤーの機能を提供するフック。
 * オーディオファイルの再生を管理し、現在の再生状態を追跡し、オーディオソース用のURL作成を処理します。
 *
 * @returns 以下の内容を含むオブジェクト：
 * - `audioRef`: 再生に使用されるオーディオ要素への React ref。
 * - `audioSrc`: 現在再生中のオーディオファイルのソースURL。
 * - `nowPlayingID`: 現在再生中のオーディオエントリのID。
 * - `playEntry`: 指定されたオーディオエントリを再生する関数。
 */
export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [nowPlayingID, setNowPlayingID] = useState(0);

  const objectUrlRef = useRef<string | null>(null);

  const revokeCurrentUrl = () => {
    if (!objectUrlRef.current) return;
    URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
  };

  const playEntry = async (entry: Mp3Entry) => {
    const audio = audioRef.current;
    if (!audio) return;

    // 前のURLを破棄
    revokeCurrentUrl();

    // File から再生用URLを作る（必要な時だけ）
    const file = await entry.fileHandle.getFile();
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;

    setAudioSrc(url);
    setNowPlayingID(entry.id);

    audio.src = url;

    try {
      await audio.play();
    } catch {
      // 自動再生扱いで弾かれる等。ここでは静かに無視してUIで再操作してもらう。
    }
  };

  return {
    audioRef,
    audioSrc,
    nowPlayingID,
    playEntry,
  };
};
