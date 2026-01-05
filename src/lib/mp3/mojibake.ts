const isLikelyMojibake = (text: string): boolean => {
  const normalized = text.trim();
  if (!normalized) return false;

  // 置換文字
  if (normalized.includes("\uFFFD")) return true;

  // 四角が出る
  if (/[□■]/.test(normalized)) return true;

  // UTF-8をlatin1で読んだ時の典型痕跡
  const markerCount = normalized.match(/[ÃÂãæ]/g)?.length ?? 0;
  if (markerCount >= 2) return true;

  // Latin-1補助（é, æ, £ など）が多い
  const latin1Count = normalized.match(/[\u00A1-\u00FF]/g)?.length ?? 0;
  return latin1Count >= 2 && normalized.length >= 4;
};

const fixMojibakeAssumingLatin1ToUtf8 = (text: string): string => {
  const normalized = text.replace(/\u0000+$/g, "");

  const bytes = new Uint8Array(
    Array.from(normalized, (ch) => (ch.codePointAt(0) ?? 0) & 0xff)
  );

  // 末尾が途中で切れてるとfatalで落ちることがあるので最大3バイト削って再挑戦
  for (let cut = 0; cut <= 3; cut += 1) {
    const sliced = cut === 0 ? bytes : bytes.subarray(0, Math.max(0, bytes.length - cut));
    try {
      return new TextDecoder("utf-8", {fatal: true}).decode(sliced).trim();
    } catch {
      // try next
    }
  }

  return new TextDecoder("utf-8", {fatal: false}).decode(bytes).trim();
};

export const normalizeTitle = (raw: unknown): string | null => {
  if (typeof raw !== "string") return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (!isLikelyMojibake(trimmed)) return trimmed;

  const fixed = fixMojibakeAssumingLatin1ToUtf8(trimmed);
  return fixed.trim() ? fixed.trim() : trimmed;
};
