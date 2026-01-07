// src/app/providers.tsx
"use client";

import React from "react";
import {SettingsProvider} from "@/components/Settings/SettingsProvider";

export function Providers({children}: {children: React.ReactNode}) {
  return (
    <SettingsProvider>
      {children}
    </SettingsProvider>
  );
}
