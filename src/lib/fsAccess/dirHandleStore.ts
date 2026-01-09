import {STORAGE} from "@/const/constants";

/**
 * 指定された名前とバージョンのIndexedDBデータベースへの接続を開きます。
 * データベースがまだ存在しない場合、またはそのバージョンが古い場合、`onupgradeneeded`イベントがトリガーされ、オブジェクトストアの作成またはアップグレードが可能になります。
 *
 * この関数は、接続成功時にはデータベースインスタンスで解決するプロミスを返します。
 * 接続に失敗した場合はエラーで拒否されます。
 *
 * @function
 * @returns {Promise<IDBDatabase>} `IDBDatabase`インスタンスで解決するプロミス。
 */
const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(STORAGE.IDB.DB_NAME, STORAGE.IDB.VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORAGE.IDB.STORE_HANDLES)) {
        db.createObjectStore(STORAGE.IDB.STORE_HANDLES);
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

/**
 * ディレクトリハンドルをIndexedDBストレージに永続化します。
 *
 * この関数はディレクトリハンドルを保存可能にし、通常は後続のファイル操作で繰り返しディレクトリアクセスを要求せずに使用できます。
 * ディレクトリハンドルは、IndexedDB内の事前定義されたオブジェクトストア内で特定のキーと共に保存されます。
 *
 * @param {FileSystemDirectoryHandle} handle - 保存するディレクトリハンドル。
 * @throws {DOMException} IndexedDBへのハンドル保存中にトランザクションエラーが発生した場合。
 * @returns {Promise<void>} ハンドルの保存が成功した時点で解決するプロミス。
 */
export const saveDirectoryHandle = async (handle: FileSystemDirectoryHandle): Promise<void> => {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORAGE.IDB.STORE_HANDLES, "readwrite");
    tx.objectStore(STORAGE.IDB.STORE_HANDLES).put(handle, STORAGE.IDB.KEY_MUSIC_DIR);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * IndexedDBストレージから非同期的に`FileSystemDirectoryHandle`を取得します。
 *
 * この関数は、特定のキーで識別される事前に保存されたディレクトリハンドルにアクセスし、
 * ハンドルが表すファイルシステムディレクトリとのやり取りを可能にします。
 * ストレージ内に該当するハンドルが見つからない場合、関数は`null`を解決します。
 *
 * この関数はIndexedDBとの読み取り専用トランザクションを確立し、
 * 保存されたハンドルの取得を試みます。
 * 操作が失敗した場合、発生したエラーと共に返されるプロミスは拒否されます。
 *
 * @returns {Promise<FileSystemDirectoryHandle | null>} 解決へと至る約束
 * `FileSystemDirectoryHandle` が存在する場合、またはハンドルが保存されていない場合は `null`。
 */
export const loadDirectoryHandle = async (): Promise<FileSystemDirectoryHandle | null> => {
  const db = await openDb();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORAGE.IDB.STORE_HANDLES, "readonly");
    const req = tx.objectStore(STORAGE.IDB.STORE_HANDLES).get(STORAGE.IDB.KEY_MUSIC_DIR);
    req.onsuccess = () => resolve((req.result ?? null) as FileSystemDirectoryHandle | null);
    req.onerror = () => reject(req.error);
  });
};

/**
 * IndexedDBに保存されている音楽ディレクトリハンドルを非同期でクリアします。
 *
 * この関数は、STORAGE.IDB.STORE_HANDLESで指定されたIndexedDBストレージにアクセスし、
 * STORAGE.IDB.KEY_MUSIC_DIRキーに関連付けられたエントリを削除します。
 * ハンドルが確実に削除され、トランザクションが正常に完了することを保証します。
 *
 * @async
 * @function clearDirectoryHandle
 * @throws {DOMException} トランザクションの実行中に失敗した場合に例外をスローします。
 */
export const clearDirectoryHandle = async () => {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORAGE.IDB.STORE_HANDLES, "readwrite");
    tx.objectStore(STORAGE.IDB.STORE_HANDLES).delete(STORAGE.IDB.KEY_MUSIC_DIR);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};
