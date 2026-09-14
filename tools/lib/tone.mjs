// How Tariq writes, from his own sent mail. Text in, structure out; nothing here calls
// Graph or a model, so it can be checked against fixtures. Ported from the workflow lane's
// runner/lib/voice.mjs on 14 Sep 2026 for the personal agent, with an audience split
// (staff / external / family) because he writes differently to Clay, to a client and to
// his father, and one averaged voice is nobody's.
//
// The corpus (hundreds of his own emails) lives in work/voice/, which is gitignored, never
// shipped and mode 700. Only memory/voice.md (the profile, with short quotes) and the
// lessons under its Corrections heading are committed and backed up.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const VOICE_DIR = path.join(ROOT, 'work/voice');
export const CORPUS = path.join(VOICE_DIR, 'corpus.json');
export const EDITS = path.join(VOICE_DIR, 'edits.jsonl');
export const DRAFT_LOG = path.join(ROOT, 'work/drafts/log.jsonl');
export const OWNER_DOMAIN = 'tfaconstructions.com.au';

/* ------------------------------------------------------------ text cleaning */
const QUOTE_MARKERS = [
  /^-{2,}\s*Original Message\s*-{2,}/im,
  /^_{10,}/m,
  /^\s*On .{5,120}\bwrote:\s*$/im,
  /^\s*From:\s.+$/im,
  /^\s*Sent from my \w+/im,
  /^\s*Get Outlook for \w+/im,
  /^\s*>{1,}\s?.+$/m,
];
const SIG_MARKERS = [
  /^--\s*$/m,
  /^\s*(Kind regards|Best regards|Regards|Thanks|Thank you|Cheers|Best)\s*,?\s*$/im,
];

/** Everything he actually typed: the quoted thread and the signature cut off. */
export function stripQuoted(raw) {
  const text = String(raw || '').replace(/\r\n/g, '\n');
  let cut = text.length;
  for (const re of QUOTE_MARKERS) { const m = re.exec(text); if (m && m.index < cut) cut = m.index; }
  return text.slice(0, cut).trim();
}

/** { greeting, body, signoff } of what he typed. */
export function segments(typed) {
  const lines = String(typed || '').split('\n');
  let greeting = '', start = 0;
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const l = lines[i].trim();
    if (!l) { start = i + 1; continue; }
    if (/^(hi|hey|hello|dear|good (morning|afternoon|evening)|morning|afternoon|salams?)\b/i.test(l) && l.length < 60) { greeting = l; start = i + 1; }
    break;
  }
  let end = lines.length, signoff = '';
  for (const re of SIG_MARKERS) {
    const rest = lines.slice(start).join('\n');
    const m = re.exec(rest);
    if (m) {
      const idx = start + rest.slice(0, m.index).split('\n').length - 1;
      if (idx < end) { end = idx; signoff = lines.slice(idx).join('\n').trim().split('\n').slice(0, 3).join('\n'); }
    }
  }
  const body = lines.slice(start, end);
  while (body.length && !body[body.length - 1].trim()) body.pop();
  const last = (body[body.length - 1] || '').trim();
  const blankAbove = body.length > 1 && !body[body.length - 2].trim();
  if (body.length > 1 && blankAbove && /^[A-Z][\w'-]*(\s+[A-Z][\w'-]*){0,2}$/.test(last)) { body.pop(); signoff = signoff ? `${last}\n${signoff}` : last; }
  return { greeting, body: body.join('\n').trim(), signoff };
}

/** staff = everyone at TFA; family = Salams / Abba / Uncle / Bro; external = the rest. */
export function audienceOf({ greeting = '', toAddrs = [] }) {
  if (/\bsalams?\b|\babba\b|\buncle\b|\bbro\b/i.test(greeting)) return 'family';
  if (toAddrs.length && toAddrs.every((a) => a.endsWith('@' + OWNER_DOMAIN))) return 'staff';
  return 'external';
}

/** One usable sample from a sent item, or null when it teaches nothing about voice. */
export function sample(msg) {
  const typed = stripQuoted(msg.body?.content || msg.bodyPreview || '');
  const seg = segments(typed);
  const words = seg.body.split(/\s+/).filter(Boolean).length;
  if (words < 8 || words > 400) return null;
  if (/^(automatic reply|out of office)/i.test(msg.subject || '')) return null;
  const toAddrs = (msg.toRecipients || []).map((r) => String(r.emailAddress?.address || '').toLowerCase()).filter(Boolean);
  const s = {
    id: msg.id,
    subject: String(msg.subject || '').replace(/^(re|fw|fwd):\s*/i, '').trim(),
    to: (msg.toRecipients || []).map((r) => r.emailAddress?.name || r.emailAddress?.address).filter(Boolean),
    toAddrs,
    sentAt: msg.sentDateTime,
    conversationId: msg.conversationId,
    greeting: seg.greeting, text: seg.body, signoff: seg.signoff, words,
  };
  s.audience = audienceOf(s);
  return s;
}

/* ------------------------------------------------------------------- stats */
const SENTENCES = (t) => t.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 1);
export function stats(samples) {
  if (!samples.length) return null;
  const n = samples.length;
  const tally = (arr) => {
    const m = new Map();
    for (const x of arr) { if (!x) continue; const k = x.toLowerCase().replace(/[,!.]+$/, ''); m.set(k, (m.get(k) || 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, c]) => ({ form: k, used: c, pct: Math.round((c / n) * 100) }));
  };
  const allText = samples.map((s) => s.text).join('\n');
  const sentences = SENTENCES(allText);
  const words = allText.split(/\s+/).filter(Boolean);
  const sorted = (f) => samples.map(f).sort((a, b) => a - b)[Math.floor(n / 2)];
  return {
    samples: n,
    medianWords: sorted((s) => s.words),
    meanSentenceWords: sentences.length ? Math.round(words.length / sentences.length) : null,
    greetings: tally(samples.map((s) => s.greeting)),
    signoffs: tally(samples.map((s) => s.signoff.split('\n')[0])),
    greetsByName: Math.round(samples.filter((s) => /^(hi|hey|hello|dear|salams?)\s+[A-Z][a-z]/i.test(s.greeting)).length / n * 100),
    noGreeting: Math.round(samples.filter((s) => !s.greeting).length / n * 100),
    contractionRate: Math.round((allText.match(/\b\w+'(s|t|re|ll|ve|d|m)\b/gi) || []).length / Math.max(1, words.length) * 1000) / 10,
    exclamationPerEmail: Math.round((allText.match(/!/g) || []).length / n * 100) / 100,
    questionPerEmail: Math.round((allText.match(/\?/g) || []).length / n * 100) / 100,
    emojiPerEmail: Math.round((allText.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).length / n * 100) / 100,
    lolPerEmail: Math.round((allText.match(/\b(lol|haha+)\b/gi) || []).length / n * 100) / 100,
    medianParagraphs: sorted((s) => s.text.split(/\n\s*\n/).length),
  };
}

/* ------------------------------------------------------- exemplars (BM25-ish) */
const STOP = new Set('the a an and or but if to of in on for with is are was were be been it this that i we you they as at by from will would can could have has had our your their re fw fwd please thanks hi'.split(' '));
const tokens = (s) => String(s || '').toLowerCase().match(/[a-z][a-z'-]{2,}/g)?.filter((t) => !STOP.has(t)) || [];

/** The k past replies most like the one being answered; same recipient and recency nudge. */
export function exemplars(samples, query, { k = 3, to = null } = {}) {
  const q = new Set(tokens(query));
  const df = new Map();
  const docs = samples.map((s) => { const t = new Set(tokens(`${s.subject} ${s.text}`)); for (const w of t) df.set(w, (df.get(w) || 0) + 1); return { s, t }; });
  const N = docs.length || 1;
  const toL = to ? String(to).toLowerCase() : null;
  return docs.map(({ s, t }) => {
    let score = 0;
    for (const w of q) if (t.has(w)) score += Math.log(1 + N / (1 + (df.get(w) || 0)));
    const ageDays = (Date.now() - new Date(s.sentAt).getTime()) / 864e5;
    score *= 1 + Math.max(0, 1 - ageDays / 365) * 0.15;
    if (toL && s.toAddrs.includes(toL)) score += 1.5;         // the same person: how he talks to THEM
    else if (toL && s.audience === audienceOf({ toAddrs: [toL] })) score += 0.5;
    return { s, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, k).map((x) => x.s);
}

/* ------------------------------------------------------------- corpus files */
const secureDir = () => { fs.mkdirSync(VOICE_DIR, { recursive: true, mode: 0o700 }); try { fs.chmodSync(VOICE_DIR, 0o700); } catch (_) {} };
export function loadCorpus() { try { return JSON.parse(fs.readFileSync(CORPUS, 'utf8')); } catch (_) { return null; } }
export function saveCorpus(obj) { secureDir(); fs.writeFileSync(CORPUS, JSON.stringify(obj, null, 2), { mode: 0o600 }); try { fs.chmodSync(CORPUS, 0o600); } catch (_) {} }

/* ------------------------------------------------------------------ edits */
/** A draft he changed: the strongest signal there is about how he wants to sound. */
export function recordEdit({ to = null, subject = null, suggested, final, source = 'chat' }) {
  if (!suggested || !final || suggested.trim() === final.trim()) return false;
  secureDir();
  fs.appendFileSync(EDITS, JSON.stringify({ at: new Date().toISOString(), source, to, subject, suggested, final }) + '\n', { mode: 0o600 });
  try { fs.chmodSync(EDITS, 0o600); } catch (_) {}
  return true;
}
export function recentEdits(k = 3) {
  try { return fs.readFileSync(EDITS, 'utf8').trim().split('\n').map((l) => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean).slice(-k).reverse(); }
  catch (_) { return []; }
}

/* --------------------------------------------------------------- draft log */
/** Every draft the agent files in Outlook, so the nightly review can find what he sent. */
export function logDraft(entry) {
  fs.mkdirSync(path.dirname(DRAFT_LOG), { recursive: true });
  fs.appendFileSync(DRAFT_LOG, JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n');
}
export function readDraftLog() {
  try { return fs.readFileSync(DRAFT_LOG, 'utf8').trim().split('\n').map((l) => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean); }
  catch (_) { return []; }
}
export const normalise = (t) => String(t || '').replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();
