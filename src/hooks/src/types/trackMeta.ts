// src/types/trackMeta.ts
export type TrackMeta = {
  title: string | null;
  artist: string | null;
  album: string | null;
  trackNo: number | null;

  // ジャケット（objectURL。無ければ null）
  coverUrl: string | null;
};

export type TrackMetaByPath = Record<string, TrackMeta | undefined>;
