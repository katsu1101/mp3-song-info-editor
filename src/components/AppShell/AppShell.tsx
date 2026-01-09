import React, {JSX} from "react";

/**
 * App Shell レイアウトのレンダリングに必要なプロパティを表します。
 *
 * AppShellProps型は、アプリケーションのレイアウトの異なるセクションに対応する標準化されたReactノードのセットを提供するために設計されています。
 * これにはヘッダー、サイドバー、メインコンテンツ領域、およびプレイヤーセクションが含まれます。
 *
 * プロパティ:
 * - `header`: アプリレイアウトのヘッダーセクションにレンダリングされるReactノード。
 * - `sidebar`: アプリレイアウトのサイドバーセクションにレンダリングされるReactノード。
 * - `main`: アプリレイアウトのメインコンテンツ領域にレンダリングされるReactノード。
 * - `player`: 右ペインにレンダリングされるReactノード。通常はプレイヤーのレンダリングに使用される。
 */
type AppShellProps = {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  main: React.ReactNode;
  player: React.ReactNode; // 右ペイン
};

/**
 * アプリケーションのレイアウト構造を定義するAppShellコンポーネントをレンダリングします。
 * これにはヘッダー、サイドバー、メインコンテンツ領域、およびプレイヤーセクションが含まれます。
 *
 * @param {Object} props - AppShell コンポーネントのプロパティオブジェクト。
 * @param {React.ReactNode} props.header - レイアウト上部に表示されるヘッダーコンテンツ。
 * @param {React.ReactNode} props.sidebar - レイアウト左セクションに表示されるサイドバーコンテンツ。
 * @param {React.ReactNode} props.main - レイアウトの中央セクションに表示されるメインコンテンツ。
 * @param {React.ReactNode} props.player - レイアウトの右セクションに表示されるプレイヤーコンテンツ。
 * @return {JSX.Element} レンダリングされたレイアウトコンポーネント。
 */
export function AppShell({header, sidebar, main, player}: AppShellProps): JSX.Element {
  return (
    <div
      style={{
        height: "100dvh",
        display: "grid",
        gridTemplateRows: "auto 1fr",
        minWidth: 0,
      }}
    >
      <div style={{position: "sticky", top: 0, zIndex: 50}}>
        {header}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "160px minmax(0, 1fr) 360px",
          gap: 12,
          padding: "10px 12px",
          minHeight: 0,
          minWidth: 0,
        }}
      >
        <aside style={{minWidth: 0, minHeight: 0, overflow: "auto"}}>
          {sidebar}
        </aside>

        <main style={{minWidth: 0, minHeight: 0, overflow: "auto"}}>
          {main}
        </main>

        <aside style={{minWidth: 0, minHeight: 0, overflow: "auto"}}>
          {/* 右ペインを追従させたいなら sticky */}
          <div style={{position: "sticky", top: 10}}>
            {player}
          </div>
        </aside>
      </div>
    </div>
  );
}
