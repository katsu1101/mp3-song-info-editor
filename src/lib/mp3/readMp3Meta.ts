import jsMediaTags      from "jsmediatags";
import {normalizeTitle} from "./mojibake";

export type Mp3Meta = {
  title: string | null;
  coverUrl: string | null;
};

type Tags = {
  title?: unknown;
  picture?: unknown;
};

type JsMediaTagsResult = {
  tags?: Tags;
};

const isNumberArrayFast = (value: unknown): value is number[] => {
  if (!Array.isArray(value)) return false;
  if (value.length === 0) return false;

  // 全走査は重いので先頭だけ軽く確認
  const sampleCount = Math.min(32, value.length);
  for (let i = 0; i < sampleCount; i += 1) {
    if (typeof value[i] !== "number") return false;
  }
  return true;
};

const toUint8Array = (data: unknown): Uint8Array | null => {
  if (data instanceof Uint8Array) return data;

  // Int8Array / Uint16Array など TypedArray 全般
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }

  if (data instanceof ArrayBuffer) return new Uint8Array(data);

  if (isNumberArrayFast(data)) return new Uint8Array(data);

  return null;
};

const pictureToObjectUrl = (picture: unknown): string | null => {
  if (!picture || typeof picture !== "object") return null;
  const record = picture as Record<string, unknown>;

  const format = record["format"];
  const data = record["data"];

  if (typeof format !== "string") return null;

  const bytes = toUint8Array(data);
  if (!bytes) return null;

  // bytes が ArrayBufferLike 背負いでも、ここで ArrayBuffer にコピーされます
  const safeBytes = new Uint8Array(bytes);
  const blob = new Blob([safeBytes], {type: format});
  return URL.createObjectURL(blob);
};

export const readMp3Meta = (file: File): Promise<Mp3Meta> =>
  new Promise((resolve) => {
    jsMediaTags.read(file, {
      onSuccess: (result) => {
        const tags = (result as unknown as JsMediaTagsResult).tags ?? {};

        const titleRaw = tags.title;
        const title = normalizeTitle(titleRaw);

        const coverUrl = pictureToObjectUrl(tags.picture);

        resolve({title, coverUrl});
      },
      onError: () => resolve({title: null, coverUrl: null}),
    });
  });
