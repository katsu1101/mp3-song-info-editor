export const runWithConcurrency = async <T>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
) => {
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
