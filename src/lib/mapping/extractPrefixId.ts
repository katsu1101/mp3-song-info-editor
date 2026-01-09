/**
 * 指定されたファイルパスから8文字の16進数プレフィックスIDを抽出します。
 *
 * この関数は、文字列パスをスキャンし、8文字の16進識別子とそれに続くアンダースコア（_）を検索し、識別子の小文字バージョンを返します。
 * 一致するものが存在しない場合、関数はnullを返します。
 *
 * @param {string} path - プレフィックスIDを抽出するファイルパス。
 * @returns {string | null} 抽出された8文字の小文字の16進数プレフィックスID。見つからない場合はnullを返す。
 */
export const extractPrefixIdFromPath = (path: string): string | null => {
  // 例: "2022/5396e324_戸定梨香_....mp3"
  // 例: "5396e324_....mp3"
  const match = /(?:^|\/)([0-9a-fA-F]{8})_/.exec(path);
  return match ? match[1].toLowerCase() : null;
};
