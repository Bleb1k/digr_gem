const DB_NAME = "CavernXYZ"
const VERSION = 1

export class DB {
  constructor() { this.db = null }

  static async init() {
    const self = new DB()
    return new Promise((res, rej) => {
      const req = indexedDB.open(DB_NAME, VERSION)
      req.onupgradeneeded = (evt) => {
        const db = evt.target.result
        switch (evt.oldVersion) {
          case 0:
            // TODO: create stores for each dimension
            db.createObjectStore('chunks', { keyPath: ["x", "y"] })
            db.createObjectStore('character', { keyPath: "id" })
            db.createObjectStore('metadata', { keyPath: "id" })
            break
          default:
            throw new Error(`Can't upgrade from version ${evt.oldVersion} to version ${evt.newVersion}`)
        }
      }
      req.onsuccess = () => { self.db = req.result; res(self) }
      req.onerror = () => rej(req.error)
    })
  }

  async save(store, obj) {
    const tx = this.db.transaction(store, 'readwrite')
    await idbPut(tx.objectStore(store), obj)
    await closeTransaction(tx)
    return obj
  }

  async load(store, key) {
    const tx = this.db.transaction(store)
    const result = await idbGet(tx.objectStore(store), key)
    await closeTransaction(tx)
    return result
  }

  async transaction(store_name, fn, perms = "readonly") {
    const tx = this.db.transaction(store_name, perms)
    let result = await fn(tx.objectStore(store_name))
    await closeTransaction(tx)
    return result
  }

  async delete() {
    return new Promise((ok, err) => {
      this.db.close()
      const del = indexedDB.deleteDatabase(DB_NAME)
      del.onsuccess = ok
      del.onerror = err
    })
  }
}

export function idbGet(store, key) {
  return new Promise((resolve, reject) => {
    const req = store.get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  });
}

export function idbPut(store, value) {
  return new Promise((resolve, reject) => {
    const req = store.put(value)
    req.onsuccess = () => resolve(value)
    req.onerror = () => reject(req.error)
  });
}

export async function idbGetOrDefault(store, key, value_fn) {
  let result = await idbGet(store, key)
  if (result === undefined) result = await idbPut(store, await value_fn())
  return result
}

export function closeTransaction(tx) {
  return new Promise(r => tx.oncomplete = r);
}


