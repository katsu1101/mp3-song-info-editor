// src/lib/fsAccess/permissions.ts
export const ensureReadPermission = async (handle: FileSystemDirectoryHandle) => {
  // queryPermission が無い実装もあり得るので、その場合は「行ける前提」で進める
  if (typeof handle.queryPermission !== "function") return true;

  const q = await handle.queryPermission({ mode: "read" });
  if (q === "granted") return true;

  // requestPermission はユーザー操作（クリック）中に呼ぶのが安全
  if (typeof handle.requestPermission !== "function") return false;

  const r = await handle.requestPermission({ mode: "read" });
  return r === "granted";
};


export const requestPersistentStorage = async () => {
  if (!navigator.storage?.persist) return false;
  return await navigator.storage.persist();
};
