// Reading and rewriting a .docx without re-rendering it.
//
// WHY THIS EXISTS. Tariq's objection to a bot touching one of his documents, in his own
// words on 15 Sep 2026: "I hate how they don't keep how it was. Okay, you're improving it.
// Great. But like when you merged it, it always loses two sentences." Every library that
// writes a .docx writes a NEW .docx: it reads the parts it understands, throws away the
// ones it does not, and re-renders. Fonts move, spacing changes, a stray paragraph goes.
//
// So this does surgery instead. A .docx is a zip of XML parts. We read the zip, keep every
// entry's ALREADY COMPRESSED bytes, and write them straight back out. Only the parts we
// deliberately change are re-encoded. Everything else is byte identical, not
// "equivalent": round-tripping a file with no changes reproduces the original file byte
// for byte, and test/botlist.test.mjs asserts exactly that.
//
// No dependencies. Node's zlib does the deflate; the zip container is 150 lines below.
import fs from 'node:fs';
import zlib from 'node:zlib';

// ---- crc32, because every zip entry carries one ----
const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

const SIG_LOCAL = 0x04034b50;
const SIG_CD = 0x02014b50;
const SIG_EOCD = 0x06054b50;

/**
 * Read a .docx (or any zip) into its entries, keeping the compressed bytes.
 * Returns { order, entries } where entries is a Map keyed by part name.
 */
export function openDocx(file) {
  const buf = fs.readFileSync(file);
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i >= buf.length - 65557; i--) {
    if (buf.readUInt32LE(i) === SIG_EOCD) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error(`${file}: not a zip (no end of central directory)`);
  const count = buf.readUInt16LE(eocd + 10);
  const cdOffset = buf.readUInt32LE(eocd + 16);
  if (cdOffset === 0xffffffff || count === 0xffff) throw new Error(`${file}: zip64, not supported`);
  const comment = buf.subarray(eocd + 22, eocd + 22 + buf.readUInt16LE(eocd + 20));

  const order = [];
  const entries = new Map();
  let p = cdOffset;
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== SIG_CD) throw new Error(`${file}: bad central directory at ${p}`);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString('utf8');
    const e = {
      name,
      versionMadeBy: buf.readUInt16LE(p + 4),
      versionNeeded: buf.readUInt16LE(p + 6),
      // bit 3 (data descriptor) is cleared on write: we always know the real sizes.
      flags: buf.readUInt16LE(p + 8) & ~0x0008,
      method: buf.readUInt16LE(p + 10),
      modTime: buf.readUInt16LE(p + 12),
      modDate: buf.readUInt16LE(p + 14),
      crc: buf.readUInt32LE(p + 16),
      compressedSize: buf.readUInt32LE(p + 20),
      uncompressedSize: buf.readUInt32LE(p + 24),
      cdExtra: buf.subarray(p + 46 + nameLen, p + 46 + nameLen + extraLen),
      cdComment: buf.subarray(p + 46 + nameLen + extraLen, p + 46 + nameLen + extraLen + commentLen),
      internalAttrs: buf.readUInt16LE(p + 36),
      externalAttrs: buf.readUInt32LE(p + 38),
      localOffset: buf.readUInt32LE(p + 42),
    };
    // The local header repeats the name and carries its own extra field; both are kept so
    // an untouched entry writes back exactly as it arrived.
    const lo = e.localOffset;
    if (buf.readUInt32LE(lo) !== SIG_LOCAL) throw new Error(`${file}: bad local header for ${name}`);
    const lNameLen = buf.readUInt16LE(lo + 26);
    const lExtraLen = buf.readUInt16LE(lo + 28);
    e.localExtra = buf.subarray(lo + 30 + lNameLen, lo + 30 + lNameLen + lExtraLen);
    const dataAt = lo + 30 + lNameLen + lExtraLen;
    e.raw = buf.subarray(dataAt, dataAt + e.compressedSize);
    order.push(name);
    entries.set(name, e);
    p += 46 + nameLen + extraLen + commentLen;
  }
  return { order, entries, comment, file };
}

/** The decompressed bytes of one part. */
export function part(pkg, name) {
  const e = pkg.entries.get(name);
  if (!e) throw new Error(`${pkg.file}: no part ${name}`);
  if (e.method === 0) return Buffer.from(e.raw);
  if (e.method === 8) return zlib.inflateRawSync(e.raw);
  throw new Error(`${pkg.file}: ${name} uses compression method ${e.method}`);
}

export function partText(pkg, name) {
  return part(pkg, name).toString('utf8');
}

/**
 * Replace one part's content. Everything else in the package is left alone, so it writes
 * back byte for byte.
 */
export function setPart(pkg, name, content) {
  const e = pkg.entries.get(name);
  if (!e) throw new Error(`${pkg.file}: no part ${name}`);
  const body = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
  const deflated = zlib.deflateRawSync(body, { level: 9 });
  e.method = 8;
  e.raw = deflated;
  e.compressedSize = deflated.length;
  e.uncompressedSize = body.length;
  e.crc = crc32(body);
  e.localExtra = Buffer.alloc(0);
  e.changed = true;
}

/** Which parts have been replaced since the package was opened. */
export function changedParts(pkg) {
  return pkg.order.filter((n) => pkg.entries.get(n).changed);
}

export function saveDocx(pkg, file) {
  const chunks = [];
  const cd = [];
  let offset = 0;
  for (const name of pkg.order) {
    const e = pkg.entries.get(name);
    const nameBuf = Buffer.from(name, 'utf8');
    const local = Buffer.alloc(30);
    local.writeUInt32LE(SIG_LOCAL, 0);
    local.writeUInt16LE(e.versionNeeded, 4);
    local.writeUInt16LE(e.flags, 6);
    local.writeUInt16LE(e.method, 8);
    local.writeUInt16LE(e.modTime, 10);
    local.writeUInt16LE(e.modDate, 12);
    local.writeUInt32LE(e.crc, 14);
    local.writeUInt32LE(e.compressedSize, 18);
    local.writeUInt32LE(e.uncompressedSize, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(e.localExtra.length, 28);
    chunks.push(local, nameBuf, e.localExtra, e.raw);

    const rec = Buffer.alloc(46);
    rec.writeUInt32LE(SIG_CD, 0);
    rec.writeUInt16LE(e.versionMadeBy, 4);
    rec.writeUInt16LE(e.versionNeeded, 6);
    rec.writeUInt16LE(e.flags, 8);
    rec.writeUInt16LE(e.method, 10);
    rec.writeUInt16LE(e.modTime, 12);
    rec.writeUInt16LE(e.modDate, 14);
    rec.writeUInt32LE(e.crc, 16);
    rec.writeUInt32LE(e.compressedSize, 20);
    rec.writeUInt32LE(e.uncompressedSize, 24);
    rec.writeUInt16LE(nameBuf.length, 28);
    rec.writeUInt16LE(e.cdExtra.length, 30);
    rec.writeUInt16LE(e.cdComment.length, 32);
    rec.writeUInt16LE(0, 34);
    rec.writeUInt16LE(e.internalAttrs, 36);
    rec.writeUInt32LE(e.externalAttrs, 38);
    rec.writeUInt32LE(offset, 42);
    cd.push(rec, nameBuf, e.cdExtra, e.cdComment);
    offset += 30 + nameBuf.length + e.localExtra.length + e.raw.length;
  }
  const cdBuf = Buffer.concat(cd);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(SIG_EOCD, 0);
  end.writeUInt16LE(pkg.order.length, 8);
  end.writeUInt16LE(pkg.order.length, 10);
  end.writeUInt32LE(cdBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(pkg.comment.length, 20);
  fs.writeFileSync(file, Buffer.concat([...chunks, cdBuf, end, pkg.comment]));
}

// ---- the body text ----

// One <w:p>. Self-closing <w:p/> counts: it is an empty paragraph and Word renders it.
const P_RE = /<w:p\b(?:[^>]*\/>|[^>]*>[\s\S]*?<\/w:p>)/g;

/**
 * Every paragraph of word/document.xml, in document order, as { xml, text, start, end }.
 *
 * `text` is every <w:t> in the paragraph joined, which is what Word shows and therefore
 * what "verbatim" has to mean. Throws if paragraphs are nested (a text box inside a
 * paragraph), because the flat scan below would silently mis-slice such a document and a
 * silent mis-slice is the exact failure this whole file exists to prevent.
 */
export function paragraphs(xml) {
  const out = [];
  let covered = 0;
  for (const m of xml.matchAll(P_RE)) {
    const gap = xml.slice(covered, m.index);
    if (/<w:p[\s>/]/.test(gap)) throw new Error('nested <w:p> found: this document needs a real XML parser');
    out.push({ xml: m[0], text: paragraphText(m[0]), start: m.index, end: m.index + m[0].length });
    covered = m.index + m[0].length;
  }
  if (/<w:p[\s>/]/.test(xml.slice(covered))) throw new Error('unclosed <w:p> found');
  return out;
}

export function paragraphText(pXml) {
  let s = '';
  for (const m of pXml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)) s += unescapeXml(m[1]);
  return s;
}

export function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function unescapeXml(s) {
  return String(s)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, '&');
}

/** The numId on a paragraph, or null when it is not in a numbered list. */
export function numIdOf(pXml) {
  const pPr = pXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
  if (!pPr) return null;
  const m = pPr[0].match(/<w:numId\s+w:val="(\d+)"/);
  return m ? m[1] : null;
}

/** Insert a block of XML into document.xml straight after the given paragraph. */
export function insertAfter(xml, para, block) {
  return xml.slice(0, para.end) + block + xml.slice(para.end);
}

/**
 * A package built from nothing, for tests and for the rare case where there is no source
 * document to do surgery on. `parts` is { name: string | Buffer } in the order they should
 * be written; the first should be '[Content_Types].xml' as the zip spec for OPC expects.
 */
export function newDocx(parts) {
  const pkg = { order: [], entries: new Map(), comment: Buffer.alloc(0), file: '<new>' };
  for (const [name, content] of Object.entries(parts)) {
    pkg.order.push(name);
    pkg.entries.set(name, {
      name,
      versionMadeBy: 0x14, versionNeeded: 0x14, flags: 0, method: 8,
      modTime: 0, modDate: 0x21, crc: 0, compressedSize: 0, uncompressedSize: 0,
      cdExtra: Buffer.alloc(0), cdComment: Buffer.alloc(0), localExtra: Buffer.alloc(0),
      internalAttrs: 0, externalAttrs: 0, localOffset: 0, raw: Buffer.alloc(0),
    });
    setPart(pkg, name, content);
  }
  return pkg;
}
