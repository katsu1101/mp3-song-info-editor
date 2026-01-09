import {Providers}         from "@/app/providers";
import type {Metadata}     from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import React, {JSX}        from "react";

/**
 * `geistSans`変数は`Geist`関数で作成された設定オブジェクトであり、Geist Sansフォントに関する一連のフォント関連設定を定義します。
 *
 * プロパティ:
 * - `variable`: 動的なフォントスタイルを格納するカスタムCSS変数名（`"--font-geist-sans"`）を指定します。
 * - `subsets`: このフォント設定がサポートする文字サブセットを示す配列です。
 *   この場合、「latin」サブセットをサポートします。
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/**
 * Geist Monoフォントの設定を表す変数。
 *
 * 構成は次のプロパティで定義されます：
 *
 * - `variable`: フォントに関連付けられたカスタムCSS変数名を指定します。
 * - `subsets`: フォントで使用可能な文字サブセットを定義する配列です。この場合、「latin」に限定されます。
 *
 * `geistMono`変数は、Geist Monoフォントをプロジェクトに統合しつつ、
 * そのサブセットとCSS変数によるアクセシビリティを制御するために使用されます。
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * アプリケーションに関する情報を含むメタデータオブジェクト。
 */
export const metadata: Metadata = {
  title: "MP3 曲情報エディター",
  description: "MP3ファイルの曲情報を編集するアプリ",
};

/**
 * アプリケーションのルートレイアウトをレンダリングします。
 *
 * @param {Readonly<{children: React.ReactNode}>} props - プロパティオブジェクト。
 * @param {React.ReactNode} props.children - ルートレイアウト内でレンダリングされる子コンポーネントまたは要素。
 * @return {JSX.Element} レンダリングされたルートレイアウトコンポーネント。
 */
export default function RootLayout({children,}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="ja">
    <body
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
    <Providers>
      {children}
    </Providers>
    </body>
    </html>
  );
}
