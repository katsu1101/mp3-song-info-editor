export type Mp3Meta = {
  title?: string;
  artist?: string;
  album?: string;
  trackNo?: number;
  year?: number;
  picture?: { data: Uint8Array; format: string };
  coverUrl?: string; // 互換用
};

export const readMp3Meta = async (file: File): Promise<Mp3Meta> => {
  // ブラウザ側でだけ読み込ませる（SSRの巻き込みを避ける）
  const {parseBlob} = await import("music-metadata");

  const metadata = await parseBlob(file, {duration: false});
  const common = metadata.common;

  const firstPicture = common.picture?.[0];

  return {
    title: common.title ?? undefined,
    artist: common.artist ?? (common.artists?.join(", ") ?? undefined),
    album: common.album ?? undefined,
    trackNo: common.track?.no ?? undefined,
    year: common.year ?? undefined,
    picture: firstPicture
      ? {data: firstPicture.data, format: firstPicture.format}
      : undefined,
  };
};