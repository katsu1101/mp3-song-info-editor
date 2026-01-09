// src/app/providers.tsx
"use client";

import {SettingsProvider} from "@/components/Settings/SettingsProvider";
import React, {JSX}       from "react";

/**
 * 子コンポーネントをSettingsProviderコンテキストでラップする機能コンポーネント。
 *
 * @param {Object} props - Providers コンポーネントに渡されるプロパティ。
 * @param {React.ReactNode} props.children - SettingsProvider でラップされる子コンポーネントまたは要素。
 * @return {JSX.Element} SettingsProvider コンテキストでラップされた子要素。
 */
export function Providers({children}: { children: React.ReactNode }): JSX.Element {
  return (
    <SettingsProvider>
      {children}
    </SettingsProvider>
  );
}
