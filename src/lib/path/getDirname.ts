/**
 * 指定されたファイルパスのディレクトリ部分を抽出します。
 *
 * この関数はファイルパスを表す文字列を受け取り、そのパスの末尾のファイル名またはフォルダ名を除いたディレクトリ部分を返します。
 * 入力パスにディレクトリ区切り文字（「/」）が含まれていない場合、空の文字列を返します。
 *
 * @param {string} path - ディレクトリ名を抽出するファイルパス。
 * @returns {string} 指定されたファイルパスのディレクトリ部分。ディレクトリが見つからない場合は空の文字列。
 */
export const getDirname = (path: string): string => {
  const slashIndex = path.lastIndexOf("/");
  return slashIndex >= 0 ? path.slice(0, slashIndex) : "";
};
