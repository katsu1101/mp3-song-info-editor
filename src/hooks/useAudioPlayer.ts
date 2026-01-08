"use client";

import type {Mp3Entry}    from "@/types";
import {useRef, useState} from "react";

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
