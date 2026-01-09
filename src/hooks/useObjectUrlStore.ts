"use client";

import {useEffect, useRef, useState} from "react";

/**
 * オブジェクトURLを管理するためのストアを提供し、自動クリーンアップと状態同期を行います。
 *
 * このカスタムフックは、特定のキーに関連付けられたオブジェクトURLのマップを管理し、これらのURLの設定、取得、クリーンアップを容易にします。
 * これにより、更新または削除された際に以前に割り当てられたオブジェクトURLが確実に無効化され、メモリリークを防止します。
 * さらに、保存されたすべてのURLをクリアする機能も提供します。
 *
 * @returns 以下の内容を含むオブジェクト：
 *   - `urlByKey` {Record<string, string | null>}: キーと対応するオブジェクトURLをマッピングする状態オブジェクト。
 *   - `setUrl` {Function}: 特定のキーに対するオブジェクトURLを設定または更新する関数。`key` (string) と `nextUrl` (string | null) を受け取る。
 *   - `clearAll` {Function}: すべてのオブジェクトURLを無効化しURLストアをリセットする関数。
 */
export const useObjectUrlStore = () => {
  const urlMapRef = useRef<Map<string, string>>(new Map());
  const [urlByKey, setUrlByKey] = useState<Record<string, string | null>>({});

  const setUrl = (key: string, nextUrl: string | null) => {
    const prevUrl = urlMapRef.current.get(key);
    if (prevUrl) URL.revokeObjectURL(prevUrl);

    if (nextUrl) urlMapRef.current.set(key, nextUrl);
    else urlMapRef.current.delete(key);

    setUrlByKey((prev) => ({...prev, [key]: nextUrl}));
  };

  const clearAll = () => {
    for (const url of urlMapRef.current.values()) URL.revokeObjectURL(url);
    urlMapRef.current.clear();
    setUrlByKey({});
  };

  useEffect(() => clearAll, []);

  return {urlByKey, setUrl, clearAll};
};
