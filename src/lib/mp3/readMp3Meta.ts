import {Mp3Meta}        from "@/types/mp3";
import {IAudioMetadata} from "music-metadata";

const looksLikeSjisMojibake = (text: string): boolean => {
  // 0x80-0xFFが多いのに日本語がほぼ無い → Shift-JISバイト列が文字化けしてる疑い
  const hasHigh = /[\u0080-\u00FF]/.test(text);
  const hasJapanese = /[\u3040-\u30FF\u3400-\u9FFF]/.test(text);
  return hasHigh && !hasJapanese;
};

const decodeFromLatin1Bytes = (text: string, encoding: "shift_jis" | "utf-8"): string => {
  const bytes = new Uint8Array([...text].map((ch) => ch.charCodeAt(0) & 0xff));
  return new TextDecoder(encoding, {fatal: false}).decode(bytes);
};

const repairSjisIfNeeded = (text: string): string => {
  const trimmed = text.replace(/\u0000/g, "").trim();
  if (trimmed.length === 0) return trimmed;
  if (!looksLikeSjisMojibake(trimmed)) return trimmed;

  // まず shift_jis を試す。ダメなら utf-8 も一応試す（保険）
  try {
    const sjis = decodeFromLatin1Bytes(trimmed, "shift_jis").trim();
    if (sjis) return sjis;
  } catch {
    // ignore
  }
  try {
    const utf8 = decodeFromLatin1Bytes(trimmed, "utf-8").trim();
    if (utf8) return utf8;
  } catch {
    // ignore
  }
  return trimmed;
};

const pickNativeText = (ids: string[], metadata: IAudioMetadata): string | undefined => {
  const native = (metadata as IAudioMetadata).native as
    | Record<string, Array<{ id: string; value: unknown }>>
    | undefined;
  if (!native) return undefined;

  const tagTypePriority = ["ID3v2.3", "ID3v2.4", "ID3v2.2", "ID3v1"];

  for (const tagType of tagTypePriority) {
    const tags = native[tagType];
    if (!tags) continue;

    for (const id of ids) {
      const found = tags.find((t) => t.id === id);
      if (!found) continue;

      const value = found.value;

      if (typeof value === "string") {
        const fixed = repairSjisIfNeeded(value);
        if (fixed) return fixed;
      }

      if (Array.isArray(value)) {
        const first = value.find((v) => typeof v === "string" && v.trim());
        if (typeof first === "string") {
          const fixed = repairSjisIfNeeded(first);
          if (fixed) return fixed;
        }
      }
    }
  }
  return undefined;
};

export const readMp3Meta = async (file: File): Promise<Mp3Meta> => {
  // ブラウザ側でだけ読み込ませる（SSRの巻き込みを避ける）
  const {parseBlob} = await import("music-metadata");

  const metadata = await parseBlob(file, {duration: false});
  const common = metadata.common;

  const firstPicture = common.picture?.[0];

  return {
    title: pickNativeText(["TIT2", "TT2"], metadata) ?? common.title,
    artist: pickNativeText(["TPE1", "TP1"], metadata) ?? (common.artist ?? common.artists?.join(", ")),
    album: pickNativeText(["TALB", "TAL"], metadata) ?? common.album,
    trackNo: common.track?.no ?? undefined,
    year: common.year ?? undefined,
    picture: firstPicture
      ? {data: firstPicture.data, format: firstPicture.format}
      : undefined,
  };
};
