// src/lib/settings/settings.ts
export type Settings = {
  ui: {
    showFilePath: boolean;
  };
  playback: {
    continuous: boolean;
    shuffle: boolean;
  };
};

export const defaultSettings: Settings = {
  ui: {
    showFilePath: false,
  },
  playback: {
    continuous: false,
    shuffle: false,
  },
};

export const SETTINGS_STORAGE_KEY = "mp3-editor.settings.v1";
