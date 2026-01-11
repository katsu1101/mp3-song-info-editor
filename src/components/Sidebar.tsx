import {useSettings}   from "@/components/Settings/SettingsProvider";
import {SettingAction} from "@/types/setting";
import React           from "react";

type SidebarMenuProps = {
  settingAction: SettingAction;
};

export function SidebarStub({settingAction}: SidebarMenuProps): React.JSX.Element {
  const {settings, toggleShowFilePath, toggleContinuous, toggleShuffle} = useSettings();

  const showFilePath = settings.ui.showFilePath;
  const isContinuous = settings.playback.continuous;
  const isShuffle = settings.playback.shuffle;

  const handleForget = (): void => {
    const ok = window.confirm("保存しているフォルダの記憶を消します。よろしいですか？");
    if (!ok) return;
    void settingAction.forget();
  };

  return (
    <div className="grid gap-4">
      <SideButton onClick={settingAction.pickFolderAndLoad}>フォルダを選ぶ</SideButton>

      {settingAction.savedHandle && settingAction.needsReconnect ? (
        <SideButton onClick={settingAction.reconnect} variant="ghost">
          再接続
        </SideButton>
      ) : null}

      <SectionTitle>再生</SectionTitle>
      <ToggleRow
        label="連続再生"
        checked={isContinuous}
        onChange={toggleContinuous}
      />
      <ToggleRow
        label="シャッフル"
        checked={isShuffle}
        onChange={toggleShuffle}
      />

      <SectionTitle>表示</SectionTitle>
      <ToggleRow
        label="file名"
        checked={showFilePath}
        onChange={toggleShowFilePath}
      />

      {settingAction.savedHandle ? (
        <>
          <SectionTitle>危険操作</SectionTitle>
          <SideButton onClick={handleForget} variant="danger">
            記憶を消す
          </SideButton>
        </>
      ) : null}
      <SectionTitle>ライブラリ</SectionTitle>
      <SideButton>すべて</SideButton>
      <SideButton>対応表あり</SideButton>
      <SideButton>対応表なし</SideButton>

      <SectionTitle>ソート</SectionTitle>
      <SideButton>Fantia順</SideButton>
      <SideButton>ファイル名順</SideButton>
    </div>
  );
}

function SectionTitle({children}: { children: React.ReactNode }): React.JSX.Element {
  return <div className="text-sm font-extrabold opacity-90">{children}</div>;
}

function ToggleRow(props: {
  label: string;
  checked: boolean;
  onChange: () => void;
}): React.JSX.Element {
  return (
    <label className="flex items-center justify-between gap-3 px-1 select-none cursor-pointer">
      <span className="text-sm opacity-90 whitespace-nowrap">{props.label}</span>

      <span
        style={{
          position: "relative",
          width: 44,
          height: 24,
          borderRadius: 999,
          border: "1px solid var(--toggle-border)",
          background: props.checked ? "var(--toggle-track-on)" : "var(--toggle-track-off)",
          transition: "background 120ms ease",
          flex: "0 0 auto",
        }}
      >
        <input
          type="checkbox"
          checked={props.checked}
          onChange={props.onChange}
          style={{position: "absolute", inset: 0, opacity: 0, cursor: "pointer"}}
          aria-label={`${props.label} の切り替え`}
        />
        <span
          style={{
            position: "absolute",
            top: 3,
            left: props.checked ? 22 : 3,
            width: 18,
            height: 18,
            borderRadius: 999,
            background: "var(--toggle-knob)",
            boxShadow: `0 2px 8px var(--toggle-knob-shadow)`,
            transition: "left 120ms ease",
          }}
        />
      </span>
    </label>
  );
}

function SideButton(
  props: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: "normal" | "ghost" | "danger";
  }
): React.JSX.Element {
  const variant = props.variant ?? "normal";

  const base =
    "text-left px-3 py-2 rounded-lg border transition";
  const normal =
    "bg-[color:var(--panel)] border-[color:var(--panel-border)] text-[color:var(--foreground)] hover:bg-[color:var(--panel-hover)]";
  const ghost =
    "bg-transparent border-[color:var(--panel-border)] text-[color:var(--foreground)] hover:bg-[color:var(--panel-hover)]";
  const danger =
    "bg-transparent border-[color:rgba(255,99,99,0.45)] text-[color:rgb(255,170,170)] hover:bg-[color:rgba(255,99,99,0.10)]";

  const klass =
    variant === "danger" ? `${base} ${danger}` :
      variant === "ghost" ? `${base} ${ghost}` :
        `${base} ${normal}`;

  return (
    <button type="button" className={klass} onClick={props.onClick}>
      {props.children}
    </button>
  );
}