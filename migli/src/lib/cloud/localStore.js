// MIGLI · Local Property Store
// ------------------------------------------------------------
// Persistência local em IndexedDB (com fallback em localStorage).
// Usado quando Supabase não está configurado, OU como cache offline
// quando está. Permite que o app inteiro funcione end-to-end sem
// nenhuma conta externa configurada.
//
// O schema espelha a tabela `properties` do Supabase: mesmas colunas,
// mesmos status, mesmo formato de slug. Ao migrar pro Supabase real,
// é trivial mover os dados.

const DB_NAME = 'migli'
const STORE_NAME = 'properties'
const DB_VERSION = 2
const LS_KEY = 'migli.properties' // fallback se IndexedDB indisponível

/* ───────── IndexedDB layer (preferido) ───────── */

let dbPromise = null

function openDB() {
  if (!('indexedDB' in window)) return Promise.reject(new Error('no-idb'))
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('slug', 'slug', { unique: false })
        store.createIndex('created_at', 'created_at', { unique: false })
      }
      // Object store pra frames (separado, blobs maiores)
      if (!db.objectStoreNames.contains('frames')) {
        const fs = db.createObjectStore('frames', {
          keyPath: ['property_id', 'index'],
        })
        fs.createIndex('property_id', 'property_id', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

async function idbAll() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}

async function idbPut(obj) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.put(obj)
    req.onsuccess = () => resolve(obj)
    req.onerror = () => reject(req.error)
  })
}

async function idbDelete(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.delete(id)
    req.onsuccess = () => resolve(true)
    req.onerror = () => reject(req.error)
  })
}

async function idbBySlug(slug) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('slug')
    const req = index.get(slug)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => reject(req.error)
  })
}

async function idbStoreFrame(propertyId, index, blob, meta) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('frames', 'readwrite')
    const store = tx.objectStore('frames')
    const req = store.put({
      property_id: propertyId,
      index,
      blob,
      ...meta,
    })
    req.onsuccess = () => resolve(true)
    req.onerror = () => reject(req.error)
  })
}

async function idbGetFrames(propertyId) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('frames', 'readonly')
    const store = tx.objectStore('frames')
    const index = store.index('property_id')
    const req = index.getAll(propertyId)
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}

async function idbDeleteFrames(propertyId) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('frames', 'readwrite')
    const store = tx.objectStore('frames')
    const index = store.index('property_id')
    const req = index.openCursor(IDBKeyRange.only(propertyId))
    req.onsuccess = (e) => {
      const cur = e.target.result
      if (cur) {
        cur.delete()
        cur.continue()
      } else {
        resolve(true)
      }
    }
    req.onerror = () => reject(req.error)
  })
}

/* ───────── localStorage fallback ───────── */

function lsAll() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  } catch {
    return []
  }
}

function lsSave(list) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list))
  } catch {
    /* ignore quota */
  }
}

/* ───────── API pública ───────── */

/**
 * Lista propriedades locais.
 */
export async function localListProperties() {
  try {
    return (await idbAll()).sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    )
  } catch {
    return lsAll()
  }
}

export async function localGetPropertyBySlug(slug) {
  try {
    return await idbBySlug(slug)
  } catch {
    return lsAll().find((p) => p.slug === slug) || null
  }
}

export async function localCreateProperty(input) {
  const now = new Date().toISOString()
  const property = {
    id: crypto.randomUUID(),
    owner_id: 'local',
    slug: input.slug || randomSlug(),
    name: input.name,
    subtitle: input.subtitle ?? null,
    price: input.price ?? null,
    status: input.status || 'draft',
    splat_url: input.splat_url ?? null,
    thumb_url: input.thumb_url ?? null,
    metadata: input.metadata ?? {},
    created_at: now,
    updated_at: now,
  }
  try {
    await idbPut(property)
  } catch {
    const list = lsAll()
    list.unshift(property)
    lsSave(list)
  }
  notify()
  return property
}

export async function localUpdateProperty(id, patch) {
  const existing = (await localListProperties()).find((p) => p.id === id)
  if (!existing) throw new Error('Imóvel não encontrado.')
  const next = {
    ...existing,
    ...patch,
    metadata: { ...(existing.metadata || {}), ...(patch.metadata || {}) },
    updated_at: new Date().toISOString(),
  }
  try {
    await idbPut(next)
  } catch {
    const list = lsAll().map((p) => (p.id === id ? next : p))
    lsSave(list)
  }
  notify()
  return next
}

export async function localDeleteProperty(id) {
  try {
    await idbDelete(id)
    await idbDeleteFrames(id)
  } catch {
    const list = lsAll().filter((p) => p.id !== id)
    lsSave(list)
  }
  notify()
}

export async function localStoreFrame(propertyId, frame) {
  try {
    await idbStoreFrame(propertyId, frame.index, frame.blob, {
      width: frame.width,
      height: frame.height,
      brightness: frame.brightness,
      sharpness: frame.sharpness,
      capturedAt: frame.capturedAt,
      bytes: frame.bytes,
    })
  } catch {
    /* fallback ignora — localStorage não suporta blobs grandes */
  }
}

export async function localGetFrames(propertyId) {
  try {
    return await idbGetFrames(propertyId)
  } catch {
    return []
  }
}

/* ───────── Pub/sub local ───────── */

const listeners = new Set()
function notify() {
  listeners.forEach((l) => {
    try {
      l()
    } catch {
      /* ignore */
    }
  })
}

export function subscribeLocalProperties(cb) {
  listeners.add(cb)
  // Também escuta storage changes de outras abas
  const onStorage = (e) => {
    if (e.key === LS_KEY) cb()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(cb)
    window.removeEventListener('storage', onStorage)
  }
}

function randomSlug() {
  return Math.random().toString(36).slice(2, 9)
}
