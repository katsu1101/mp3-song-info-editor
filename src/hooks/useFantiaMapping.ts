"use client";

import {loadFantiaMappingFromPublic}            from "@/lib/mapping/loadFantiaMapping";
import {FantiaMappingEntry, FantiaMappingState} from "@/types/fantia";
import {useEffect, useMemo, useState}           from "react";

/**
 * Fantiaのマッピングデータを処理するための状態と機能を提供するカスタムフック。
 *
 * このフックは、Fantiaのマッピングエントリとその関連状態の読み込み、管理、およびアクセス提供を担当します。
 * マッピングデータを非同期で取得し、プロセス中のエラーを処理し、迅速な検索のためのプレフィックスIDによるマッピングを公開します。
 *
 * @returns {FantiaMappingState} 以下の要素を含むオブジェクト：
 * - `mapping`: Fantia マッピングエントリの配列。
 * - `mappingByPrefixId`: キーが正規化された `prefixId` 値、値が対応するマッピングエントリである Map。
 * - `error`: データ取得中に発生したエラーメッセージ（存在する場合）を表す文字列。
 * - `isLoading`: データの読み込みがまだ進行中かどうかを示すブール値。
 */
export const useFantiaMapping = (): FantiaMappingState => {
  const [mapping, setMapping] = useState<FantiaMappingEntry[]>([]);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      try {
        const data = await loadFantiaMappingFromPublic();
        if (isCancelled) return;
        setMapping(data);
      } catch (e) {
        if (isCancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, []);

  const mappingByPrefixId = useMemo(() => {
    const map = new Map<string, FantiaMappingEntry>();
    for (const entry of mapping) {
      if (!entry.prefixId) continue;
      map.set(entry.prefixId.toLowerCase(), entry);
    }
    return map;
  }, [mapping]);

  return {mapping, mappingByPrefixId, error, isLoading};
};
