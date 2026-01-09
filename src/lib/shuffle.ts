/**
 * 配列の要素をランダムな順序にシャッフルします。
 *
 * @template T
 * @param {readonly T[]} items - シャッフルする要素の配列。入力配列は変更されません。
 * @returns {T[]} 要素がランダムな順序にシャッフルされた新しい配列。
 */
export const shuffleArray = <T, >(items: readonly T[]): T[] => {
  const result = [...items]; // 元を壊さない
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};