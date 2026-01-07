"use client";

import React, {createContext, useContext, useEffect, useMemo, useReducer, useRef} from "react";
import {defaultSettings, SETTINGS_STORAGE_KEY, type Settings} from "@/lib/settings/settings";

type Action =
  | {type: "replace"; settings: Settings}
  | {type: "set"; path: string; value: unknown}
  | {type: "toggle"; path: string};

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getByPath = (obj: unknown, path: string): unknown => {
  const keys = path.split(".").filter(Boolean);
  let current: unknown = obj;

  for (const key of keys) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }

  return current;
};

type Container = UnknownRecord | unknown[];

const isArrayIndexKey = (key: string): boolean => {
  if (key.length === 0) return false;
  const n = Number(key);
  return Number.isInteger(n) && String(n) === key;
};

const cloneContainerOrEmpty = (value: unknown): Container => {
  if (Array.isArray(value)) return [...value];
  if (isRecord(value)) return {...value};
  return {};
};

const getChild = (container: Container, key: string): unknown => {
  if (Array.isArray(container) && isArrayIndexKey(key)) {
    return container[Number(key)];
  }
  if (!Array.isArray(container)) {
    return container[key];
  }
  return undefined;
};

const setChild = (container: Container, key: string, value: unknown): void => {
  if (Array.isArray(container) && isArrayIndexKey(key)) {
    container[Number(key)] = value;
    return;
  }
  if (!Array.isArray(container)) {
    container[key] = value;
  }
};

export const setByPath = <T,>(obj: T, path: string, value: unknown): T => {
  const keys = path.split(".").filter(Boolean);
  if (keys.length === 0) return obj;

  // root を shallow copy（非objectならそのまま返す：互換性保険）
  const root: Container | null =
    Array.isArray(obj) ? [...obj] :
      isRecord(obj) ? {...obj} :
        null;

  if (!root) return obj;

  let cur: Container = root;

  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]!;
    const next = getChild(cur, k);

    // ✅ next が object/array 以外でも壊れないように（互換性のため保険）
    const copied = cloneContainerOrEmpty(next);

    setChild(cur, k, copied);
    cur = copied;
  }

  setChild(cur, keys[keys.length - 1]!, value);
  return root as unknown as T;
};


const reducer = (state: Settings, action: Action): Settings => {
  switch (action.type) {
    case "replace":
      return action.settings;
    case "set":
      return setByPath(state, action.path, action.value);
    case "toggle": {
      const cur = getByPath(state, action.path);
      if (typeof cur !== "boolean") return state;
      return setByPath(state, action.path, !cur);
    }
    default:
      return state;
  }
};

const loadSettings = (): Settings => {
  try {
    if (typeof window === "undefined") return defaultSettings;

    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaultSettings;

    const parsed = JSON.parse(raw) as Partial<Settings>;

    return {
      ui: {showFilePath: parsed.ui?.showFilePath ?? defaultSettings.ui.showFilePath},
      playback: {
        continuous: parsed.playback?.continuous ?? defaultSettings.playback.continuous,
        shuffle: parsed.playback?.shuffle ?? defaultSettings.playback.shuffle,
      },
    };
  } catch {
    return defaultSettings;
  }
};

const saveSettings = (settings: Settings) => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // storage禁止環境は無視
  }
};

type SettingsContextValue = {
  settings: Settings;
  setSetting: (path: string, value: unknown) => void;
  toggleSetting: (path: string) => void;

  toggleContinuous: () => void;
  toggleShuffle: () => void;
  toggleShowFilePath: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const SettingsProvider = ({children}: {children: React.ReactNode}) => {
  const [settings, dispatch] = useReducer(reducer, defaultSettings);

  // ✅ 「ロード完了」フラグ（これが無いと defaultSettings が先に保存される）
  const hasHydratedRef = useRef(false);

  // 初回ロード
  useEffect(() => {
    dispatch({type: "replace", settings: loadSettings()});
    hasHydratedRef.current = true;
  }, []);

  // 変更保存（ロード完了後のみ）
  useEffect(() => {
    if (!hasHydratedRef.current) return;
    saveSettings(settings);
  }, [settings]);

  const value = useMemo<SettingsContextValue>(() => ({
    settings,
    setSetting: (path, value) => dispatch({type: "set", path, value}),
    toggleSetting: (path) => dispatch({type: "toggle", path}),

    toggleContinuous: () => dispatch({type: "toggle", path: "playback.continuous"}),
    toggleShuffle: () => dispatch({type: "toggle", path: "playback.shuffle"}),
    toggleShowFilePath: () => dispatch({type: "toggle", path: "ui.showFilePath"}),
  }), [settings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = (): SettingsContextValue => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
};
