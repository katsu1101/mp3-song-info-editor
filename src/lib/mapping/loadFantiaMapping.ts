import {parseFantiaMappingText} from "@/lib/mapping/parseFantiaMapping";
import {FantiaMappingEntry}     from "@/types/fantia";

/**
 * アプリケーションのベースパスを取得し、末尾にスラッシュが付かないことを保証します。
 *
 * この関数は、`NEXT_PUBLIC_BASE_PATH`環境変数の使用を前提としています。
 * これは、GitHub Pagesデプロイや類似の環境で一般的に利用されます。
 * 変数が定義されていない場合、空の文字列が返されます。
 *
 * 返されるベースパス文字列は、末尾のスラッシュが常に削除されます。
 *
 * @returns {string} 末尾のスラッシュを含まないアプリケーションのベースパス。
 */
const getBasePath = (): string => {
  // GitHub Pagesで basePath を使っている前提（あなたのプロジェクトに合わせて）
  return (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
};

/**
 * 指定されたURLからテキストデータを取得し、UTF-8としてデコードします。
 *
 * この関数は、Fetch API を使用して指定された URL に対してネットワークリクエストを実行します。
 * 最新のデータを確実に取得するため、キャッシュオプションは "no-store" に設定されています。
 * レスポンスが成功しなかった場合（ステータスが 200-299 の範囲外）、エラーをスローします。
 * レスポンスの内容は ArrayBuffer として読み取られ、UTF-8 エンコーディングを使用して文字列にデコードされます。
 *
 * @param {string} url - テキストデータを取得するURL。
 * @returns {Promise<string>} レスポンスからUTF-8デコードされたテキストを含む文字列を解決するプロミス。
 * @throws {Error} ネットワークリクエストが失敗した場合、またはレスポンスステータスが正常でない場合。
 */
const fetchTextUtf8 = async (url: string): Promise<string> => {
  const response = await fetch(url, {cache: "no-store"});
  if (!response.ok) {
    throw new Error(`対応表の読み込みに失敗しました: ${response.status} ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  return new TextDecoder("utf-8").decode(buffer);
};

/**
 * 公開`data`ディレクトリからFantiaマッピングファイルを非同期で読み込み、解析します。
 *
 * この関数は、Fantiaマッピングエントリを含むタブ区切り値（TSV）ファイルを取得し、
 * その内容を解析し、解析されたマッピングエントリの配列を返します。
 *
 * @param {string} [filename="fantia-mapping.tsv"] - 読み込むファイル名。指定しない場合、デフォルトは "fantia-mapping.tsv" です。
 * @returns {Promise<FantiaMappingEntry[]>} Fantia マッピングエントリの配列を解決するプロミス。
 * @throws {Error} ファイルの取得または解析に失敗した場合、または指定されたマッピングが無効な場合。
 */
export const loadFantiaMappingFromPublic = async (
  filename: string = "fantia-mapping.tsv"
): Promise<FantiaMappingEntry[]> => {
  const basePath = getBasePath();
  const url = `${basePath}/data/${filename}`;
  const text = await fetchTextUtf8(url);
  return parseFantiaMappingText(text);
};
