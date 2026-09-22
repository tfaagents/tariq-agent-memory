// Email attachments, the part that needs no network: which ones to take, what to call the
// file on disk, and where it may land. mail.mjs does the Graph calls and the writing.
//
// Built 21 Sep 2026 for wall r-20260921-01: he asked for the TFA ASIC extract, the agent
// found the email (Kendal to Heather, 19 Aug) and could not hand him the PDF because
// mail.mjs had no way to download an attachment. Telegram's reply tool takes a file path,
// so a download into work/inbox/ is the whole gap.
import path from 'node:path';

/** Telegram's bot API refuses a document over 50 MB; leave headroom. */
export const SIZE_CAP = 45 * 1024 * 1024;

export const kb = (n) => n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : n < 1024 ? `${n} B` : `${Math.round(n / 1024)} KB`;

/** A short label for the kind of file, from the content type or the extension. */
export function kindLabel(a) {
  const ext = path.extname(a.name || '').slice(1).toLowerCase();
  const ct = String(a.contentType || '').toLowerCase();
  if (a.type === 'item') return 'attached email';
  if (a.type === 'reference') return 'link to a file in OneDrive or SharePoint';
  if (ext === 'pdf' || ct.includes('pdf')) return 'PDF';
  if (['doc', 'docx'].includes(ext) || ct.includes('word')) return 'Word';
  if (['xls', 'xlsx', 'csv'].includes(ext) || ct.includes('sheet') || ct.includes('excel')) return 'spreadsheet';
  if (['ppt', 'pptx'].includes(ext) || ct.includes('presentation')) return 'slides';
  if (['jpg', 'jpeg', 'png', 'gif', 'heic', 'webp'].includes(ext) || ct.startsWith('image/')) return 'image';
  if (['zip', '7z', 'rar'].includes(ext) || ct.includes('zip')) return 'zip';
  if (ext) return ext.toUpperCase();
  return ct.split('/').pop() || 'file';
}

/** One line per attachment, numbered in listing order (inline ones keep their number). */
export function describe(a, i) {
  const parts = [kindLabel(a)];
  if (a.size) parts.push(kb(a.size));
  if (a.isInline) parts.push('inline image, part of the signature or the body');
  return `${i + 1}. ${a.name || '(no name)'} (${parts.join(', ')})`;
}

/** A file name that cannot leave the folder it is written into, and is never empty. */
export function safeName(name, fallback = 'attachment') {
  // Separators become spaces, so "../../tools/mail.mjs" cannot leave the folder; the
  // dot-only pieces that traversal leaves behind are dropped so the name still reads.
  let s = String(name || '').replace(/[\\/:\u0000-\u001f]/g, ' ')
    .split(/\s+/).filter((t) => t && !/^\.+$/.test(t)).join(' ');
  s = s.replace(/^\.+/, '');                 // no dotfiles
  if (!s) s = fallback;
  if (s.length > 120) {
    const ext = path.extname(s).slice(0, 12);
    s = s.slice(0, 120 - ext.length) + ext;
  }
  return s;
}

/** The first free path in dir for name: name.pdf, name (2).pdf, name (3).pdf ... */
export function uniquePath(dir, name, exists) {
  const ext = path.extname(name);
  const stem = name.slice(0, name.length - ext.length);
  let candidate = path.join(dir, name);
  for (let n = 2; exists(candidate); n++) candidate = path.join(dir, `${stem} (${n})${ext}`);
  return candidate;
}

/** Downloads may land only under work/. The agent is denied Edit on tools/, config/, hooks
 *  and settings; a --to that pointed there would be a way around the wall. */
export function withinWork(root, dir) {
  const work = path.resolve(root, 'work');
  const target = path.resolve(root, dir || 'work/inbox');
  return target === work || target.startsWith(work + path.sep) ? target : null;
}

/**
 * Which attachments to download. sel is undefined or "all" (every non-inline one), a
 * 1-based number from the listing, or (part of) a name. Returns { picked, why } where
 * why is a plain sentence when nothing was picked.
 */
export function pick(list, sel) {
  if (!list.length) return { picked: [], why: 'No attachments on that email.' };
  if (sel === undefined || sel === null || String(sel).toLowerCase() === 'all') {
    const picked = list.filter((a) => !a.isInline);
    return picked.length ? { picked, why: null } : { picked: [], why: 'Only inline images (signature logos and the like). Name one by number if you want it.' };
  }
  const s = String(sel).trim();
  if (/^\d+$/.test(s)) {
    const a = list[Number(s) - 1];
    return a ? { picked: [a], why: null } : { picked: [], why: `No attachment ${s}; that email has ${list.length}.` };
  }
  const q = s.toLowerCase();
  const exact = list.filter((a) => String(a.name || '').toLowerCase() === q);
  if (exact.length === 1) return { picked: exact, why: null };
  const partial = list.filter((a) => String(a.name || '').toLowerCase().includes(q));
  if (partial.length === 1) return { picked: partial, why: null };
  if (partial.length > 1) return { picked: [], why: `"${s}" matches ${partial.length} attachments; use the number.` };
  return { picked: [], why: `No attachment called "${s}" on that email.` };
}

/** Why one attachment cannot be downloaded, or null when it can. */
export function blocker(a) {
  if (a.type === 'reference') return 'a link to a file in OneDrive or SharePoint, not a copy: open it in Outlook, or ask for it by its OneDrive path';
  if (a.size > SIZE_CAP) return `${kb(a.size)} is too big to send on Telegram (the limit is 50 MB); open it in Outlook`;
  return null;
}
