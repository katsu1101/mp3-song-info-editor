// src/lib/id3/readId3v2.ts
export type Id3Basic = {
  album: string | null;
  trackNo: number | null;
  trackTotal: number | null;
};

const readBytes = async (file: File, start: number, length: number): Promise<Uint8Array> => {
  const buffer = await file.slice(start, start + length).arrayBuffer();
  return new Uint8Array(buffer);
};

const synchsafeToInt = (b0: number, b1: number, b2: number, b3: number): number =>
  ((b0 & 0x7f) << 21) | ((b1 & 0x7f) << 14) | ((b2 & 0x7f) << 7) | (b3 & 0x7f);

const decodeText = (encodingByte: number, data: Uint8Array): string => {
  const stripNulls = (s: string) => s.replace(/\u0000+$/g, "").trim();

  // 0: ISO-8859-1, 1: UTF-16 with BOM, 2: UTF-16BE, 3: UTF-8
  if (encodingByte === 0) {
    const decoder = new TextDecoder("iso-8859-1");
    return stripNulls(decoder.decode(data));
  }

  if (encodingByte === 3) {
    const decoder = new TextDecoder("utf-8");
    return stripNulls(decoder.decode(data));
  }

  if (encodingByte === 2) {
    const decoder = new TextDecoder("utf-16be");
    return stripNulls(decoder.decode(data));
  }

  // encodingByte === 1 (UTF-16 with BOM)
  if (data.length >= 2) {
    const b0 = data[0];
    const b1 = data[1];
    if (b0 === 0xff && b1 === 0xfe) {
      return stripNulls(new TextDecoder("utf-16le").decode(data.subarray(2)));
    }
    if (b0 === 0xfe && b1 === 0xff) {
      return stripNulls(new TextDecoder("utf-16be").decode(data.subarray(2)));
    }
  }
  // BOMが無い/不明ならLEに倒す
  return stripNulls(new TextDecoder("utf-16le").decode(data));
};

const parseTrck = (value: string): {trackNo: number | null; trackTotal: number | null} => {
  const text = value.trim();
  if (!text) return {trackNo: null, trackTotal: null};

  // 例: "3/12", "03/12", "3"
  const [left, right] = text.split("/", 2).map((x) => x?.trim());
  const trackNo = left && /^\d+$/.test(left) ? Number(left) : null;
  const trackTotal = right && /^\d+$/.test(right) ? Number(right) : null;
  return {trackNo, trackTotal};
};

export const readId3v2Basic = async (file: File): Promise<Id3Basic> => {
  // ID3 header: 10 bytes
  const header = await readBytes(file, 0, 10);
  if (header.length < 10) return {album: null, trackNo: null, trackTotal: null};

  // "ID3"
  if (header[0] !== 0x49 || header[1] !== 0x44 || header[2] !== 0x33) {
    // ID3v2が無い（ID3v1のみ等）は今回は未対応
    return {album: null, trackNo: null, trackTotal: null};
  }

  const versionMajor = header[3]; // 3 or 4 が多い
  // const flags = header[5];
  const tagSize = synchsafeToInt(header[6], header[7], header[8], header[9]);

  // タグ領域（header 10 bytes + tagSize bytes）
  const tagBytes = await readBytes(file, 10, tagSize);
  const view = new DataView(tagBytes.buffer, tagBytes.byteOffset, tagBytes.byteLength);

  let offset = 0;
  let album: string | null = null;
  let trckRaw: string | null = null;

  const frameHeaderSize = 10; // v2.3/v2.4

  while (offset + frameHeaderSize <= tagBytes.length) {
    const idBytes = tagBytes.subarray(offset, offset + 4);
    const frameId = String.fromCharCode(...idBytes);

    // 終端（ゼロ埋め）
    if (!frameId.trim().replace(/\u0000/g, "")) break;

    const sizeBytes = tagBytes.subarray(offset + 4, offset + 8);

    // v2.3: 32bit BE, v2.4: synchsafe
    const frameSize =
      versionMajor === 4
        ? synchsafeToInt(sizeBytes[0], sizeBytes[1], sizeBytes[2], sizeBytes[3])
        : view.getUint32(offset + 4, false);

    // flags(2 bytes) は今回は無視
    const contentStart = offset + 10;
    const contentEnd = contentStart + frameSize;

    if (frameSize <= 0 || contentEnd > tagBytes.length) break;

    if (frameId === "TALB" || frameId === "TRCK") {
      const encoding = tagBytes[contentStart];
      const textData = tagBytes.subarray(contentStart + 1, contentEnd);
      const text = decodeText(encoding, textData);

      if (frameId === "TALB" && !album) album = text || null;
      if (frameId === "TRCK" && !trckRaw) trckRaw = text || null;

      // 両方取れたら早期終了
      if (album && trckRaw) break;
    }

    offset = contentEnd;
  }

  const {trackNo, trackTotal} = trckRaw ? parseTrck(trckRaw) : {trackNo: null, trackTotal: null};
  return {album, trackNo, trackTotal};
};
