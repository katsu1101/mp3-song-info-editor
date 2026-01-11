"use client";

import type {SettingAction} from "@/types/setting";
import React                from "react";

type Props = {
  settingAction: SettingAction;
};

export function EmptyStateFolderActions({settingAction}: Props): React.JSX.Element {
  const canReconnect = Boolean(settingAction.savedHandle && settingAction.needsReconnect);

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      {canReconnect ? (
        <button
          type="button"
          style={{
            width: "min(640px, 100%)",
            borderRadius: 18,
            border: "1px solid var(--panel-border)",
            background: "var(--panel)",
            padding: 22,
            textAlign: "center",
            marginBottom: 16,
          }}
          onClick={() => void settingAction.reconnect()}
        >
          <div style={{fontSize: 18, fontWeight: 900, marginBottom: 10}}>
            再接続
          </div>

          <div style={{opacity: 0.75, fontSize: 13, marginBottom: 18}}>
            以前に開いたフォルダを再読み込みします
          </div>
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => void settingAction.pickFolderAndLoad()}
        style={{
          width: "min(640px, 100%)",
          borderRadius: 18,
          border: "1px solid var(--panel-border)",
          background: "var(--panel)",
          padding: 22,
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        <div style={{fontSize: 18, fontWeight: 900, marginBottom: 10}}>
          フォルダをを選んで開く
        </div>

        <div style={{opacity: 0.75, fontSize: 13, marginBottom: 18}}>
          このアプリはローカルフォルダを読み込んで曲一覧を表示します。
        </div>
      </button>
      <div
        role="note"
        style={{
          width: "min(640px, 100%)",
          borderRadius: 16,
          border: "1px solid var(--warn-border)",
          background: "var(--warn-bg)",
          padding: "14px 16px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 6,
            background: "var(--warn-bar)",
            opacity: 1,
          }}
        />
        <div style={{minWidth: 0}}>
          <div style={{fontSize: 16, fontWeight: 900, lineHeight: 1.2, color: "var(--warn-title)"}}>
            ⚠️ 読み込みに少し時間がかかることがあります
          </div>
          <div style={{marginTop: 6, fontSize: 15, color: "var(--warn-text)", lineHeight: 1.5}}>
            曲数やジャケット画像の数が多いほど時間がかかります。固まって見えても数秒お待ちください。
          </div>
        </div>
      </div>
    </div>
  );
}
