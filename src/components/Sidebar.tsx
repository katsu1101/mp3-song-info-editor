import React, {JSX} from "react";

/**
 * ライブラリと並べ替えオプションを備えたサイドバーをレンダリングする機能コンポーネント。
 *
 * @return {JSX.Element} グリッドレイアウトでスタイル設定されたライブラリボタンとソートボタンを含む、レンダリングされた SidebarStub コンポーネント。
 */
export function SidebarStub(): JSX.Element {
  return (
    <div style={{display: "grid", gap: 12}}>
      <div style={{fontWeight: 800, opacity: 0.9}}>ライブラリ</div>
      <button style={sideButtonStyle}>すべて</button>
      <button style={sideButtonStyle}>対応表あり</button>
      <button style={sideButtonStyle}>対応表なし</button>

      <div style={{marginTop: 8, fontWeight: 800, opacity: 0.9}}>ソート</div>
      <button style={sideButtonStyle}>Fantia順</button>
      <button style={sideButtonStyle}>ファイル名順</button>
    </div>
  );
}

/**
 * サイドボタンのスタイルを定義するCSSプロパティオブジェクト。
 */
const sideButtonStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
};
