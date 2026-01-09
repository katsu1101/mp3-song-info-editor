import {TrackMetaByPath} from "@/types/trackMeta";

/**
 * 特定の設定またはフォルダに関連付けられた操作とメタデータを表します。
 * このタイプは、フォルダ構成、メタデータ、および関連する操作を管理するために使用されます。
 *
 * プロパティ:
 * - `folderName` (文字列): 設定に関連付けられたフォルダーの名前。
 * - `errorMessage` (文字列): 操作中に発生したエラーの詳細を説明するメッセージ。
 * - `metaByPath` (TrackMetaByPath): ファイルパスごとに情報を追跡するメタデータオブジェクト。
 * - `savedHandle` (FileSystemDirectoryHandle | null): 保存済みまたは接続済みのディレクトリへのハンドル。
 * - `needsReconnect` (boolean): フォルダへの再接続が必要かどうかを示すフラグ。
 *
 * 方法:
 * - `pickFolderAndLoad`: ユーザーがフォルダを選択するためのダイアログを開き、そのフォルダの内容を読み込みます。
 * - `reconnect`: 切断が発生した場合、保存されたフォルダハンドルへの再接続を試みます。
 * - `forget`: 保存されたフォルダと関連するメタデータをクリアし、事実上そのフォルダを「忘却」します。
 */
export type SettingAction = {
  folderName: string,
  errorMessage: string,
  // ✅ TrackMeta 本体
  metaByPath: TrackMetaByPath,
  savedHandle: FileSystemDirectoryHandle | null,
  needsReconnect: boolean,
  pickFolderAndLoad: () => Promise<void>;
  reconnect: () => Promise<void>;
  forget: () => Promise<void>;
}

/**
 * アプリケーションの設定を表し、UIおよび再生の好みが含まれます。
 */
export type Settings = {
  ui: {
    showFilePath: boolean;
  };
  playback: {
    continuous: boolean;
    shuffle: boolean;
  };
};

/**
 * アプリケーションのデフォルト設定。
 *
 * この変数には、ユーザーインターフェースと再生動作の基本設定が含まれています。
 * ユーザー設定の初期化やリセットの起点として使用できます。
 *
 * プロパティ:
 * - `ui`: ユーザーインターフェースの設定に関連する設定。
 *   - `showFilePath`: ファイルパスをUIに表示するかどうかを決定します。デフォルトは `false` です。
 * - `playback`: メディア再生動作に関連する設定。
 *   - `continuous`: メディアアイテム終了後に自動再生を継続するかどうかを示す。デフォルトは `false`。
 *   - `shuffle`: 再生をシャッフル順で行うかどうかを指定する。デフォルトは `false`。
 */
export const defaultSettings: Settings = {
  ui: {
    showFilePath: false,
  },
  playback: {
    continuous: false,
    shuffle: false,
  },
};

/**
 * ローカルストレージにアプリケーション設定を保存および取得するために使用される定数キー。
 * このキーは、MP3エディタ設定の現在のバージョンに関連付けられたストレージエントリを識別します。
 * このキーを変更すると、以前のバージョンに関連付けられた既存の設定は無効になります。
 */
export const SETTINGS_STORAGE_KEY = "mp3-editor.settings.v1";

