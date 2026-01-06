import {parseFantiaMappingText}  from "@/lib/mapping/parseFantiaMapping";
import type {FantiaMappingEntry} from "@/types/mapping";

const getBasePath = (): string => {
  // GitHub Pagesで basePath を使っている前提（あなたのプロジェクトに合わせて）
  return (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
};

const fetchTextUtf8 = async (url: string): Promise<string> => {
  const response = await fetch(url, {cache: "no-store"});
  if (!response.ok) {
    throw new Error(`対応表の読み込みに失敗しました: ${response.status} ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  return new TextDecoder("utf-8").decode(buffer);
};

export const loadFantiaMappingFromPublic = async (
  filename = "fantia-mapping.tsv"
): Promise<FantiaMappingEntry[]> => {
  const basePath = getBasePath();
  const url = `${basePath}/data/${filename}`;
  const text = await fetchTextUtf8(url);
  return parseFantiaMappingText(text);
};
