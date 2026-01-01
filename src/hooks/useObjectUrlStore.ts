"use client";

import {useEffect, useRef, useState} from "react";

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
