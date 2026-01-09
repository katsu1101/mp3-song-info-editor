/**
 * 指定された並列度で、アイテムのコレクションに対して渡されたワーカー関数を実行します。
 *
 * @template T
 * @param {readonly T[]} items - 処理対象のアイテムの配列。
 * @param {number} concurrency - ワーカーの最大同時実行数。
 * @param {(item: T) => Promise<void>} worker - 単一アイテムを処理する非同期関数。
 * @returns {Promise<void>} 全てのアイテム処理完了時に解決するプロミス。
 */
export const runWithConcurrency = async <T>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
): Promise<void> => {
  const queue = [...items];

  const runner = async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) return;
      await worker(item);
    }
  };

  const count = Math.max(1, concurrency);
  await Promise.all(Array.from({length: count}, runner));
};
