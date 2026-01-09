"use client";

import {defaultSettings, Settings, SETTINGS_STORAGE_KEY}                               from "@/types/setting";
import React, {createContext, JSX, useContext, useEffect, useMemo, useReducer, useRef} from "react";

/**
 * 実行可能な操作を表し、特定の状態を様々な方法で変更します。
 *
 * `Action` タイプは、以下の3つのアクションのいずれかになります：
 * - 設定全体を置き換える。
 * - 指定されたパスで特定の値を設定する。
 * - 指定されたパスでブール値を切り替える。
 *
 * `Action`型のプロパティは、アクションタイプに応じて以下のように異なります：
 *
 * - "replace": 現在の設定を新しい設定に置き換えます。`Settings`型の`settings`プロパティが必要です。
 * - "set": 指定された `path` に特定の値を設定します。`path` プロパティ（文字列）と `value`（任意の型）が必要です。
 * - "toggle": 指定された `path` にあるブール値を切り替えます。`path` プロパティ（文字列）が必要です。
 */
type Action =
  | { type: "replace"; settings: Settings }
  | { type: "set"; path: string; value: unknown }
  | { type: "toggle"; path: string };

/**
 * 未知の型の文字列キーと値を持つレコードを表します。
 *
 * `UnknownRecord`型は、文字列キーを持つオブジェクトを定義するためのユーティリティであり、値は任意の型を取ることができます。
 * オブジェクトの構造が不明確である場合や、実行時に動的に変化する場合に有用です。
 */
type UnknownRecord = Record<string, unknown>;

/**
 * 指定された値が、null ではなく配列でもないオブジェクトであるかどうかを確認します。
 * これにより、レコードのような構造として扱われます。
 *
 * @param {unknown} value - チェック対象の値。
 * @returns {value is UnknownRecord} 値が null ではないオブジェクトであり、配列ではないことを示すブール値。
 */
const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * オブジェクト内のネストされたパスにある値を取得します。
 *
 * この関数はオブジェクトと文字列のパスを入力として受け取り、オブジェクト内の指定されたパスにある値を返します。
 * パスはドットで区切られたキーの文字列として定義されます。
 * パスが存在しない場合、または入力が有効なオブジェクトでない場合、関数は `undefined` を返します。
 *
 * @param {unknown} obj - 値を取得する対象となるオブジェクト。任意の型が可能です。
 * @param {string} path - 目的のプロパティへのパスを表す、ドット区切りの文字列。
 * @returns {unknown} - 指定されたパスで見つかった値、またはパスが無効な場合は `undefined` を返します。
 */
const getByPath = (obj: unknown, path: string): unknown => {
  const keys = path.split(".").filter(Boolean);
  let current: unknown = obj;

  for (const key of keys) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }

  return current;
};

/**
 * 未知のキーと値のペアを持つレコード、
 * または未知の要素の配列のいずれかであるコンテナを表します。
 *
 * この型は、格納する要素の型や構造に特定の制約を課すことなく、データを柔軟に格納するための構造を提供するように設計されています。
 *
 * データ型や構造を事前に決定できない場合に使用できます。
 *
 * 注意: この型を扱う際は注意が必要です。型安全性を提供せず、保持する内容に関する保証もありません。
 */
type Container = UnknownRecord | unknown[];

/**
 * 指定された文字列が有効な配列のインデックスキーであるかどうかを確認します。
 *
 * 配列のインデックスキーは、非負の整数を表す文字列です。
 * この関数は、文字列が整数に変換可能かどうかを確認し、
 * 元の文字列と一致するかどうかを検証します。
 *
 * @param {string} key - 配列のインデックスキーとして検証される文字列。
 * @returns {boolean} 文字列が有効な配列インデックスキーの場合に `true` を返し、そうでない場合は `false` を返します。
 */
const isArrayIndexKey = (key: string): boolean => {
  if (key.length === 0) return false;
  const n = Number(key);
  return Number.isInteger(n) && String(n) === key;
};

/**
 * 指定された値が配列またはレコードの場合、それを複製して新しいコンテナを作成します。
 * 値が配列またはレコードでない場合、空のオブジェクトを返します。
 *
 * @param {unknown} value - クローンまたは置換する値。
 * @returns {Container} クローンされた配列、クローンされたレコード、または空のオブジェクト。
 */
const cloneContainerOrEmpty = (value: unknown): Container => {
  if (Array.isArray(value)) return [...value];
  if (isRecord(value)) return {...value};
  return {};
};

/**
 * 指定されたキーに基づいて、与えられたコンテナから子要素を取得します。
 * この関数は配列とオブジェクトの両方のコンテナを扱います。コンテナが配列の場合、
 * キーが有効な配列インデックスを表す場合、対応する要素を返します。
 * コンテナがオブジェクトの場合、指定されたキーを持つプロパティを取得します。
 * キーが見つからない場合、またはコンテナの型がキーの型と一致しない場合、undefined を返します。
 *
 * @param {Container} container - 子要素を取得するコンテナ。
 *                                配列またはオブジェクトを指定できます。
 * @param {string} key - 配列内のインデックスまたはオブジェクトのプロパティ名を指定するキー。
 * @returns {unknown} キーに対応する子要素。見つからない場合はundefinedを返します。
 */
const getChild = (container: Container, key: string): unknown => {
  if (Array.isArray(container) && isArrayIndexKey(key)) {
    return container[Number(key)];
  }
  if (!Array.isArray(container)) {
    return container[key];
  }
  return undefined;
};

/**
 * コンテナオブジェクトまたは配列内の子プロパティを更新または設定します。
 *
 * コンテナが配列であり、指定されたキーが有効な配列インデックスである場合、
 * 値は配列内の対応するインデックスに割り当てられます。
 * コンテナが配列でない場合、キーと値のペアはコンテナオブジェクトに設定されます。
 *
 * @param {Container} container - 対象のコンテナ。オブジェクトまたは配列のいずれかです。
 * @param {string} key - 値を設定するプロパティ名またはインデックス。
 * @param {unknown} value - コンテナの指定されたプロパティまたはインデックスに割り当てる値。
 * @returns {void}
 */
const setChild = (container: Container, key: string, value: unknown): void => {
  if (Array.isArray(container) && isArrayIndexKey(key)) {
    container[Number(key)] = value;
    return;
  }
  if (!Array.isArray(container)) {
    container[key] = value;
  }
};

/**
 * オブジェクトまたは配列内の深くネストされたプロパティの値を、特定のドット区切りパス文字列を使用して更新します。
 * パスが存在しない場合、必要に応じて中間オブジェクトまたは配列が作成されます。
 * 更新された値を持つ元のオブジェクトの新しい浅いコピーを返し、元のオブジェクトは変更されません。
 *
 * @template T 更新対象のオブジェクトの型。
 * @param {T} obj 変更対象のオブジェクトまたは配列。
 * @param {string} path ネストされたプロパティへのパスを示すドット区切りの文字列。
 * @param {unknown} value 指定されたパスに設定する値。
 * @returns {T} 指定された値が更新された新しいオブジェクトまたは配列。
 */
export const setByPath = <T, >(obj: T, path: string, value: unknown): T => {
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

/**
 * ディスパッチされたアクションに基づいて設定状態の更新を管理するリデューサー関数。
 *
 * @param {Settings} state - 設定の現在の状態。
 * @param {Action} action - 変更の種類と関連データを指定するアクションオブジェクト。
 * @returns {Settings} 指定されたアクションを適用した後の更新された設定状態。
 *
 * リデューサーは以下のアクションタイプを処理します：
 * - "replace": アクションオブジェクトから提供された設定で状態全体を置き換えます。
 * - "set": アクションで指定された 'path' で識別される特定のプロパティを変更し、状態を更新します。
 * - "toggle": アクションで指定された 'path' で識別される特定のプロパティのブール値を切り替えます。値がブール値でない場合、状態は変更されません。
 * - デフォルト: アクションタイプが認識されない場合、現在の状態を変更せずに返します。
 */
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

/**
 * アプリケーション設定をローカルストレージから読み込むか、事前定義された設定をデフォルトとして使用します。
 *
 * この関数は、ブラウザのローカルストレージに保存されたユーザー設定を、事前定義されたストレージキーを使用して取得しようと試みます。
 * データが利用できない場合、不正な形式の場合、またはコードがブラウザ環境以外で実行された場合、アプリケーションのデフォルト設定を返します。
 *
 * @returns {Settings} ユーザー設定またはデフォルト値を含む設定オブジェクト。
 */
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

/**
 * ユーザー定義の設定をローカルストレージに永続化します。
 *
 * この関数は`Settings`オブジェクトを受け取り、シリアライズされたJSON文字列としてブラウザのローカルストレージに保存します。
 * ローカルストレージが利用不可または制限されている場合、エラーをスローせずに操作は静かに失敗します。
 *
 * @param {Settings} settings - 保存する設定オブジェクト。
 */
const saveSettings = (settings: Settings) => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // storage禁止環境は無視
  }
};

/**
 * アプリケーション設定を管理するためのコンテキスト値を表します。
 */
type SettingsContextValue = {
  settings: Settings;
  setSetting: (path: string, value: unknown) => void;
  toggleSetting: (path: string) => void;

  toggleContinuous: () => void;
  toggleShuffle: () => void;
  toggleShowFilePath: () => void;
};

/**
 * Reactコンポーネントツリー内でアプリケーション設定を管理・提供するコンテキストオブジェクト。
 *
 * `SettingsContext`は、各レベルで明示的にプロパティを渡すことなく、
 * アプリケーション設定に関連する状態とメソッドを複数のコンポーネント間で共有するために使用されます。
 *
 * このコンテキストのデフォルト値は `null` です。
 * プロバイダを使用して `SettingsContextValue` オブジェクトを提供する必要があります。このオブジェクトには通常、
 * 設定管理に必要なデータと関数が含まれます。
 *
 * このコンテキストを利用する消費者は、対応するプロバイダー内で使用されることを保証し、
 * コンテキスト値として`null`へのアクセスを試みないようにする必要があります。
 */
const SettingsContext = createContext<SettingsContextValue | null>(null);

/**
 * 子コンポーネントに設定コンテキストを提供するReactコンポーネント。
 * `useReducer`フックを使用してアプリケーション設定を管理し、永続ストレージと同期します。
 *
 * このコンポーネントは、初期設定が読み込まれたことを示すハイドレーションフラグを使用することで、設定が時期尚早に保存されるのを防ぎます。
 * 設定へのその後の変更は、修正時に自動的に保存されます。
 *
 * 個々の設定値を更新するメソッド、
 * 特定の設定を切り替えるメソッド、および連続再生、シャッフル、ユーザーインターフェースの好みなどの機能を制御するメソッドを公開します。
 *
 * @param {object} props - SettingsProvider コンポーネントのプロパティ。
 * @param {React.ReactNode} props.children - 設定コンテキストを利用する子コンポーネント。
 * @returns {JSX.Element} 設定コンテキストのプロバイダーコンポーネント。
 */
export const SettingsProvider = ({children}: { children: React.ReactNode }): JSX.Element => {
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

/**
 * 設定コンテキスト値へのアクセスを提供するカスタムフック。
 *
 * このフックは現在の設定コンテキストを取得し、それが有効な `SettingsProvider` 内で使用されていることを保証します。
 * フックが `SettingsProvider` の外部で呼び出された場合、エラーをスローします。
 *
 * @throws {Error} フックが `SettingsProvider` の外部で使用された場合。
 * @returns {SettingsContextValue} SettingsContext の現在の値。
 */
export const useSettings = (): SettingsContextValue => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
};
