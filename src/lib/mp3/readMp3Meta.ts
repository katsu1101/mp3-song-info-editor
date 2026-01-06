import {TrackMeta} from "@/hooks/src/types/trackMeta";
import jsMediaTags from "jsmediatags";

type JsMediaTagsPicture = {
  format?: string;
  data?: number[]; // jsmediatags は number[] のことが多い
};

type JsMediaTags = {
  title?: unknown;
  artist?: unknown;
  album?: unknown;
  track?: unknown; // "1/12" や "1" が来ることがある
  picture?: JsMediaTagsPicture;
};

const toNullableString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toNullableTrackNo = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    // "03" / "3/12" / "3 / 12" などを許容して先頭の数字だけ拾う
    const match = value.trim().match(/^(\d+)/);
    if (!match) return null;
    const n = Number(match[1]);
    return Number.isFinite(n) ? n : null;
  }

  return null;
};
const toCoverObjectUrl = (picture: JsMediaTagsPicture | undefined): string | null => {
  if (!picture?.data || picture.data.length === 0) return null;

  const bytes = new Uint8Array(picture.data);
  const mimeType = typeof picture.format === "string" && picture.format.trim().length > 0
    ? picture.format
    : "image/jpeg";

  const blob = new Blob([bytes], {type: mimeType});
  return URL.createObjectURL(blob);
};

const readTags = (file: File): Promise<JsMediaTags> => {
  return new Promise((resolve, reject) => {
    jsMediaTags.read(file, {
      onSuccess: (result) => resolve(result.tags as JsMediaTags),
      onError: (error) => {
        // error: { type, info }
        const message =
          typeof error?.type === "string"
            ? `${error.type}: ${String(error.info ?? "")}`.trim()
            : String(error);
        reject(new Error(message));
      },
    });
  });
};

export const readMp3Meta = async (file: File): Promise<TrackMeta> => {
  try {
    const tags = await readTags(file);

    return {
      title: toNullableString(tags.title),
      artist: toNullableString(tags.artist),
      album: toNullableString(tags.album),
      trackNo: toNullableTrackNo(tags.track),
      coverUrl: toCoverObjectUrl(tags.picture),
    };
  } catch {
    // 失敗しても UI を壊さない：空メタで返す
    return {
      title: null,
      artist: null,
      album: null,
      trackNo: null,
      coverUrl: null,
    };
  }
};