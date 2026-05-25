// MIGLI · Frame download helper
// ---------------------------------------------------------------
// Empacota os frames capturados em um único arquivo .zip que o usuário
// pode baixar. Útil enquanto o pipeline GPU não está conectado (Opção 3
// do plano: reconstrução manual offline).
//
// Implementação minimalista sem dependências externas: ZIP STORE (sem
// compressão) é trivial de gerar e suficiente para JPEGs (que já são
// comprimidos). 30-100 frames a ~80KB cada = ~3-8MB final.

const ZIP_VERSION = 20

/**
 * Recebe um array de frames {blob, index} e retorna um Blob ZIP único.
 */
export async function buildFramesZip(frames, manifest) {
  const records = []
  let offset = 0
  const central = []

  // Adiciona manifest.json (com metadados da sessão)
  if (manifest) {
    const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {
      type: 'application/json',
    })
    const r = await prepareEntry('manifest.json', manifestBlob, offset)
    records.push(r.local)
    central.push(r.central)
    offset += r.localSize
  }

  for (const frame of frames) {
    const name = `frames/${String(frame.index).padStart(4, '0')}.jpg`
    const r = await prepareEntry(name, frame.blob, offset)
    records.push(r.local)
    central.push(r.central)
    offset += r.localSize
  }

  const centralStart = offset
  let centralSize = 0
  for (const c of central) {
    centralSize += c.byteLength
  }

  // End of central directory record
  const eocd = new Uint8Array(22)
  const v = new DataView(eocd.buffer)
  v.setUint32(0, 0x06054b50, true) // signature
  v.setUint16(4, 0, true) // disk number
  v.setUint16(6, 0, true) // disk with central directory
  v.setUint16(8, central.length, true) // entries on this disk
  v.setUint16(10, central.length, true) // total entries
  v.setUint32(12, centralSize, true)
  v.setUint32(16, centralStart, true)
  v.setUint16(20, 0, true) // comment length

  const parts = [...records, ...central, eocd]
  return new Blob(parts, { type: 'application/zip' })
}

/**
 * Aciona download do blob no navegador.
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 0)
}

/* ────────────────────────────────────────────── */

async function prepareEntry(name, blob, offset) {
  const data = new Uint8Array(await blob.arrayBuffer())
  const nameBytes = new TextEncoder().encode(name)
  const crc = crc32(data)
  const size = data.length

  // Local file header (30 bytes + name)
  const local = new Uint8Array(30 + nameBytes.length + size)
  const dv = new DataView(local.buffer)
  dv.setUint32(0, 0x04034b50, true) // signature
  dv.setUint16(4, ZIP_VERSION, true) // version needed
  dv.setUint16(6, 0, true) // flags
  dv.setUint16(8, 0, true) // compression (0 = STORE)
  dv.setUint16(10, 0, true) // mod time
  dv.setUint16(12, 0, true) // mod date
  dv.setUint32(14, crc, true)
  dv.setUint32(18, size, true) // compressed size
  dv.setUint32(22, size, true) // uncompressed size
  dv.setUint16(26, nameBytes.length, true)
  dv.setUint16(28, 0, true) // extra field length
  local.set(nameBytes, 30)
  local.set(data, 30 + nameBytes.length)

  // Central directory header (46 bytes + name)
  const central = new Uint8Array(46 + nameBytes.length)
  const cdv = new DataView(central.buffer)
  cdv.setUint32(0, 0x02014b50, true)
  cdv.setUint16(4, ZIP_VERSION, true) // version made by
  cdv.setUint16(6, ZIP_VERSION, true) // version needed
  cdv.setUint16(8, 0, true)
  cdv.setUint16(10, 0, true)
  cdv.setUint16(12, 0, true)
  cdv.setUint16(14, 0, true)
  cdv.setUint32(16, crc, true)
  cdv.setUint32(20, size, true)
  cdv.setUint32(24, size, true)
  cdv.setUint16(28, nameBytes.length, true)
  cdv.setUint16(30, 0, true) // extra
  cdv.setUint16(32, 0, true) // comment
  cdv.setUint16(34, 0, true) // disk
  cdv.setUint16(36, 0, true) // internal attrs
  cdv.setUint32(38, 0, true) // external attrs
  cdv.setUint32(42, offset, true) // local header offset
  central.set(nameBytes, 46)

  return { local, central, localSize: local.length }
}

/**
 * CRC32 standard — usado pelo PKZIP. Versão tabular pra performance.
 */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[i] = c
  }
  return table
})()

function crc32(data) {
  let c = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}
