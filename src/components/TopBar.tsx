"use client";

import {useSettings}   from "@/components/Settings/SettingsProvider";
import {SettingAction} from "@/types/setting";
import React, {JSX}    from "react";

/**
 * TopBarコンポーネントに必要なプロパティを表します。
 */
type TopBarProps = {
  title: string;
  settingAction: SettingAction;
};

/**
 * カスタマイズ可能なタイトル、フォルダ関連のアクション、設定トグルを備えたトップバーをレンダリングする機能コンポーネント。
 *
 * @param {Object} props - TopBarコンポーネントに渡されるプロパティ。
 * @param {string} props.title - トップバーに表示されるタイトル。
 * @param {Object} props.settingAction - フォルダ関連のアクションとプロパティを含むオブジェクト。
 * @param {string} [props.settingAction.folderName] - 現在選択されているフォルダー名。
 * @param {Function} props.settingAction.pickFolderAndLoad - フォルダーを選択して読み込む関数。
 * @param {Function} props.settingAction.reconnect - 以前に保存されたフォルダーに再接続する関数。
 * @param {Function} props.settingAction.forget - 保存済みフォルダを忘れる関数。
 * @param {boolean} [props.settingAction.needsReconnect] - 再接続が必要かどうかを示すフラグ。
 * @param {boolean} [props.settingAction.savedHandle] - フォルダハンドルが保存されているかどうかを示すフラグ。
 *
 * @return {JSX.Element} The rendered header containing the title, folder actions, and toggleable settings.
 */
export function TopBar(props: TopBarProps): JSX.Element {
  const {title, settingAction} = props;

  const {settings, toggleShowFilePath, toggleContinuous, toggleShuffle} = useSettings();

  const showFilePath = settings.ui.showFilePath;
  const isContinuous = settings.playback.continuous;
  const isShuffle = settings.playback.shuffle;

  const handleForget = () => {
    const ok = window.confirm("保存しているフォルダの記憶を消します。よろしいですか？");
    if (!ok) return;
    settingAction.forget().then();
  };

  return (
    <header
      style={{
        marginTop: 8,
        padding: "10px 12px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(0,0,0,0.25)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {/* 左：タイトル + 状態 */}
        <div style={{display: "flex", alignItems: "baseline", gap: 10, minWidth: 220, flex: "1 1 auto"}}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 900,
              lineHeight: 1.1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 320,
            }}
            title={title}
          >
            {title}
          </div>

          <span
            style={{
              fontSize: 12,
              opacity: 0.75,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 360,
            }}
            title={settingAction.folderName}
          >
            {settingAction.folderName
              ? `選択中: ${settingAction.folderName}`
              : "未選択"}
          </span>
        </div>

        {/* 中：フォルダ操作 */}
        <div style={{display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap"}}>
          <button
            onClick={settingAction.pickFolderAndLoad}
            style={{
              padding: "6px 10px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.22)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            フォルダを選ぶ
          </button>

          {settingAction.savedHandle && settingAction.needsReconnect ? (
            <button
              onClick={settingAction.reconnect}
              style={{
                padding: "6px 10px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "transparent",
                color: "white",
                opacity: 0.9,
                whiteSpace: "nowrap",
              }}
            >
              再接続
            </button>
          ) : null}
        </div>

        {/* 右：トグル + 危険操作 */}
        <div style={{display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end"}}>

          {/* ✅ 連続再生（ヘッダー右へ） */}
          <label style={{display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none"}}>
            <span style={{fontSize: 12, opacity: 0.85}}>連続</span>
            <span style={toggleTrackStyle(isContinuous)}>
              <input
                type="checkbox"
                checked={isContinuous}
                onChange={toggleContinuous}
                style={{position: "absolute", inset: 0, opacity: 0, cursor: "pointer"}}
                aria-label="連続再生の切り替え"
              />
              <span style={toggleKnobStyle(isContinuous)}/>
            </span>
            <span style={{fontSize: 12, opacity: 0.7}}>{isContinuous ? "ON" : "OFF"}</span>
          </label>

          {/* shuffle */}
          <label style={{display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none"}}>
            <span style={{fontSize: 12, opacity: 0.85}}>シャッフル</span>
            <span style={toggleTrackStyle(isShuffle)}>
              <input
                type="checkbox"
                checked={isShuffle}
                onChange={toggleShuffle}
                style={{position: "absolute", inset: 0, opacity: 0, cursor: "pointer"}}
                aria-label="シャッフルの切り替え"
              />
              <span style={toggleKnobStyle(isShuffle)}/>
            </span>
            <span style={{fontSize: 12, opacity: 0.7}}>{isContinuous ? "ON" : "OFF"}</span>
          </label>

          {/* file名表示スイッチ */}
          <label style={{display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none"}}>
            <span style={{fontSize: 12, opacity: 0.85, whiteSpace: "nowrap"}}>file名</span>

            <span
              style={{
                position: "relative",
                width: 44,
                height: 24,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.18)",
                background: showFilePath ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.10)",
                transition: "background 120ms ease",
              }}
            >
              <input
                type="checkbox"
                checked={showFilePath}
                onChange={() => toggleShowFilePath()}
                style={{position: "absolute", inset: 0, opacity: 0, cursor: "pointer"}}
                aria-label="ファイル名表示の切り替え"
              />
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: showFilePath ? 22 : 3,
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.85)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                  transition: "left 120ms ease",
                }}
              />
            </span>
          </label>

          {/* 記憶を消す（confirm付き） */}
          {settingAction.savedHandle ? (
            <button
              onClick={handleForget}
              style={{
                padding: "6px 10px",
                borderRadius: 10,
                border: "1px solid rgba(255, 99, 99, 0.45)",
                background: "transparent",
                color: "rgb(255, 170, 170)",
                fontWeight: 800,
                whiteSpace: "nowrap",
              }}
              title="保存しているフォルダの記憶を消します"
            >
              記憶を消す
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

/**
 * トグルトラック要素のスタイル設定用CSSプロパティのセットを生成します。
 */
const toggleTrackStyle = (checked: boolean): React.CSSProperties => ({
  position: "relative",
  width: 44,
  height: 24,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.18)",
  background: checked ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
});

/**
 * チェック状態に基づいてトグルノブ要素のスタイルオブジェクトを生成します。
 */
const toggleKnobStyle = (checked: boolean): React.CSSProperties => ({
  position: "absolute",
  top: 3,
  left: checked ? 22 : 3,
  width: 18,
  height: 18,
  borderRadius: 999,
  background: "rgba(255,255,255,0.85)",
  boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
  transition: "left 120ms ease",
});