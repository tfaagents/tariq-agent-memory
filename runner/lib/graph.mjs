// Microsoft Graph helper, vendored from tfa-agents/runner/lib/graph.mjs on 10 Sep 2026 for
// Tariq's agent, which runs as its own macOS user and cannot read the tfa-agents folder.
// Config: ../../config/connections.json in THIS repo; cert paths there point at the
// tariq user's own key. Keep in sync with the foundation copy; sending stays runner-side.
// Microsoft Graph helper for TFA agents. Used two ways:
//   - imported by runner scripts (getToken, api, sendMail, ...)
//   - as a CLI by agents inside claude -p, e.g.:
//       node graph.mjs list-users
//       node graph.mjs search-from someone@example.com
//       node graph.mjs search-from someone@example.com kendall@tfaconstructions.com.au
// Auth: certificate only (tenant policy blocks client secrets). Read scopes plus
// Mail.Send as agents@; the CLI exposes read commands only — sending is runner-side.
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(fs.readFileSync(path.join(here, '../../config/connections.json'), 'utf8'))['m365-graph'];
const expand = (p) => p.replace(/^~/, os.homedir());
const KEY_PATH = expand(process.env.TARIQ_GRAPH_KEY || process.env.TFA_GRAPH_KEY || cfg.keyPath);
const CRT_PATH = expand(process.env.TARIQ_GRAPH_CRT || process.env.TFA_GRAPH_CRT || cfg.certPath);

// One token cache per app registration. The default app is the one in connections.json;
// tools/send.mjs uses the second ("Tariq Assistant Send") through client({...}).
const caches = new Map();
const DEFAULT_APP = { clientId: cfg.clientId, keyPath: KEY_PATH, certPath: CRT_PATH };

async function tokenFor(app) {
  const c = caches.get(app.clientId) || {};
  if (c.token && Date.now() < c.until - 60_000) return c.token;
  // A missing cert is the single most common reason an agent fails on a new
  // machine, and a bare ENOENT tells whoever reads the chat nothing. Say which
  // file, and that it is expected to be missing off the mini.
  let key, crt;
  try {
    key = fs.readFileSync(expand(app.keyPath));
    crt = fs.readFileSync(expand(app.certPath));
  } catch (_) {
    throw new Error(`No Microsoft 365 certificate on this machine (looked in ${expand(app.keyPath)}). ` +
      `That is expected anywhere but the TFA mini, set TFA_GRAPH_KEY and TFA_GRAPH_CRT to test elsewhere.`);
  }
  const b64u = (b) => Buffer.from(b).toString('base64url');
  const x5t = b64u(Buffer.from(new crypto.X509Certificate(crt).fingerprint.replace(/:/g, ''), 'hex'));
  const now = Math.floor(Date.now() / 1000);
  const header = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT', x5t }));
  const claims = b64u(JSON.stringify({
    aud: `https://login.microsoftonline.com/${cfg.tenantId}/oauth2/v2.0/token`,
    iss: app.clientId, sub: app.clientId, jti: crypto.randomUUID(), nbf: now, exp: now + 600,
  }));
  const sig = crypto.sign('RSA-SHA256', Buffer.from(`${header}.${claims}`), key).toString('base64url');
  const res = await fetch(`https://login.microsoftonline.com/${cfg.tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: app.clientId,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: `${header}.${claims}.${sig}`,
    }),
  });
  const tok = await res.json();
  if (!tok.access_token) throw new Error(`token failed: ${JSON.stringify(tok)}`);
  caches.set(app.clientId, { token: tok.access_token, until: Date.now() + tok.expires_in * 1000 });
  return tok.access_token;
}

export async function getToken() { return tokenFor(DEFAULT_APP); }

async function request(app, pathAndQuery, opts = {}) {
  const token = await tokenFor(app);
  const res = await fetch(`https://graph.microsoft.com/v1.0${pathAndQuery}`, {
    ...opts,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(opts.headers || {}) },
  });
  if (res.status === 202 || res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(`${res.status} ${data?.error?.code || ''}: ${data?.error?.message || 'graph error'}`);
    err.status = res.status;
    throw err;
  }
  return data;
}
async function requestRaw(app, pathAndQuery, opts = {}) {
  const token = await tokenFor(app);
  const res = await fetch(`https://graph.microsoft.com/v1.0${pathAndQuery}`, {
    ...opts,
    headers: { authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`${res.status}: ${text.slice(0, 200) || 'graph error'}`);
    err.status = res.status;
    throw err;
  }
  return Buffer.from(await res.arrayBuffer());
}

export async function api(pathAndQuery, opts = {}) { return request(DEFAULT_APP, pathAndQuery, opts); }
/** Same call, raw bytes back (attachment content, not JSON). */
export async function raw(pathAndQuery, opts = {}) { return requestRaw(DEFAULT_APP, pathAndQuery, opts); }
/** A Graph client for another app registration (the send app): { api, raw }. */
export function client(app) {
  return { api: (p, o = {}) => request(app, p, o), raw: (p, o = {}) => requestRaw(app, p, o) };
}

/* --------------------------------------------------------- attachments (FLOW 08) */

/** Inbox messages that carry attachments, newest first, since an ISO time.
 *  Graph refuses a filter on hasAttachments combined with an orderby on another
 *  property ("InefficientFilter", seen 8 Sep 2026), so the time is the filter and
 *  the attachment flag is checked here. */
export async function inboxWithAttachments(mailbox, sinceISO, { top = 100 } = {}) {
  const data = await api(`/users/${encodeURIComponent(mailbox)}/mailFolders/inbox/messages` +
    `?$filter=receivedDateTime ge ${sinceISO}` +
    `&$select=id,subject,from,receivedDateTime,hasAttachments,bodyPreview,webLink,conversationId` +
    `&$orderby=receivedDateTime desc&$top=${top}`);
  return (data.value || []).filter((m) => m.hasAttachments);
}

/** Attachment metadata for one message: id, name, contentType, size, isInline. No bytes. */
export async function listAttachments(mailbox, messageId) {
  const data = await api(`/users/${encodeURIComponent(mailbox)}/messages/${encodeURIComponent(messageId)}/attachments` +
    `?$select=id,name,contentType,size,isInline`);
  return (data.value || []).map((a) => ({
    id: a.id, name: a.name || null, contentType: a.contentType || null, size: Number(a.size || 0), isInline: Boolean(a.isInline),
    isFile: a['@odata.type'] === '#microsoft.graph.fileAttachment',
  }));
}

/** The bytes of one file attachment. */
export async function attachmentContent(mailbox, messageId, attachmentId) {
  return raw(`/users/${encodeURIComponent(mailbox)}/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}/$value`);
}

export async function listMailboxUsers() {
  const data = await api('/users?$select=displayName,mail,userPrincipalName&$top=100');
  return data.value.filter((u) => u.mail);
}

export async function searchFrom(fromAddress, mailbox) {
  const boxes = mailbox ? [{ mail: mailbox, displayName: mailbox }] : await listMailboxUsers();
  const results = [];
  for (const box of boxes) {
    try {
      const q = `/users/${encodeURIComponent(box.mail)}/messages` +
        `?$filter=${encodeURIComponent(`from/emailAddress/address eq '${fromAddress.replace(/'/g, "''")}'`)}` +
        `&$select=subject,receivedDateTime,from&$top=25`;
      const data = await api(q);
      for (const m of data.value) {
        results.push({ mailbox: box.mail, received: m.receivedDateTime, subject: m.subject });
      }
    } catch (e) {
      // 404 = no mailbox behind this user (unlicensed); report other errors per-box
      if (e.status !== 404) results.push({ mailbox: box.mail, error: e.message });
    }
  }
  return results;
}

export async function recentInbox(mailbox, hours = 24) {
  const since = new Date(Date.now() - hours * 3600_000).toISOString();
  const data = await api(`/users/${encodeURIComponent(mailbox)}/mailFolders/inbox/messages` +
    `?$filter=receivedDateTime ge ${since}` +
    `&$select=id,subject,from,receivedDateTime,isRead,bodyPreview,webLink&$orderby=receivedDateTime desc&$top=100`);
  return data.value;
}

export async function unreadInbox() {
  const data = await api(`/users/${encodeURIComponent(cfg.senderMailbox)}/mailFolders/inbox/messages` +
    `?$filter=isRead eq false&$select=id,subject,from,receivedDateTime,bodyPreview,body&$top=20`);
  return data.value;
}

export async function sendMail(to, subject, bodyText) {
  await api(`/users/${encodeURIComponent(cfg.senderMailbox)}/sendMail`, {
    method: 'POST',
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: 'Text', content: bodyText },
        toRecipients: [{ emailAddress: { address: to } }],
      },
      saveToSentItems: true,
    }),
  });
}


/**
 * Send one email AS a person (bulk-emails). Two calls rather than /sendMail:
 * creating the message first hands back its conversationId and internetMessageId,
 * which is how a reply or a bounce is matched to the row it belongs to later.
 * Needs Mail.ReadWrite (create) and Mail.Send (send) as application permissions.
 * Attachments are inline base64, so keep them under about 3 MB each; Graph rejects
 * a single request over 4 MB.
 */
export async function createAndSend(sender, { to, subject, html, attachments = [] }) {
  const message = {
    subject,
    body: { contentType: 'HTML', content: html },
    toRecipients: [{ emailAddress: { address: to } }],
  };
  if (attachments.length) {
    message.attachments = attachments.map((a) => ({
      '@odata.type': '#microsoft.graph.fileAttachment', name: a.name, contentType: a.contentType || 'application/octet-stream', contentBytes: Buffer.from(a.bytes).toString('base64'),
    }));
  }
  const created = await api(`/users/${encodeURIComponent(sender)}/messages`, { method: 'POST', body: JSON.stringify(message) });
  await api(`/users/${encodeURIComponent(sender)}/messages/${encodeURIComponent(created.id)}/send`, { method: 'POST' });
  return { id: created.id, conversationId: created.conversationId || null, internetMessageId: created.internetMessageId || null, webLink: created.webLink || null };
}

/** Inbox messages since a time, newest first, with the conversation id. For reply and bounce matching. */
export async function inboxSince(mailbox, sinceISO, { top = 100, folder = 'inbox' } = {}) {
  const data = await api(`/users/${encodeURIComponent(mailbox)}/mailFolders/${folder}/messages` +
    `?$filter=receivedDateTime ge ${sinceISO}` +
    `&$select=id,subject,from,receivedDateTime,conversationId,bodyPreview,webLink` +
    `&$orderby=receivedDateTime desc&$top=${top}`);
  return (data.value || []).map((m) => ({
    id: m.id, subject: m.subject || '', from: m.from?.emailAddress?.address?.toLowerCase() || null, fromName: m.from?.emailAddress?.name || null,
    received: m.receivedDateTime, conversationId: m.conversationId || null, preview: m.bodyPreview || '', link: m.webLink || null,
  }));
}

/* ------------------------------------------------------------------ mailboxes */

/**
 * The mailboxes agents may read, from config — NOT from /users.
 *
 * listMailboxUsers() needs User.Read.All, which TFA's app registration does not
 * have. Rather than leave every agent broken until that consent lands, the
 * mailboxes are named in config/connections.json. That is also the safer default:
 * an explicit list is a boundary a person chose, where /users is "everything the
 * tenant happens to contain", including mailboxes nobody meant to expose.
 */
export function configuredMailboxes() {
  const list = cfg.mailboxes || [];
  if (!list.length) throw new Error('config/connections.json m365-graph.mailboxes is empty, name the mailboxes agents may read');
  return list;
}

/**
 * Tenant-wide scope (Jaiah, 14 Sep 2026, Tariq's agent only): when config/connections.json
 * has "scope": "tenant", the mailboxes are every enabled member account in the directory
 * that has a mailbox, read through User.Read.All and cached in work/people.json for
 * twelve hours. The named list above stays as the fallback when the directory cannot be
 * read. The workflow lane's copy of this file keeps the named list.
 */
const PEOPLE_CACHE = path.join(here, '../../work/people.json');
export async function directoryPeople({ maxAgeHours = 12 } = {}) {
  try {
    const c = JSON.parse(fs.readFileSync(PEOPLE_CACHE, 'utf8'));
    if (Date.now() - Date.parse(c.at) < maxAgeHours * 3600e3 && Array.isArray(c.people) && c.people.length) return c.people;
  } catch (_) {}
  const people = [];
  let next = '/users?$select=id,displayName,mail,userPrincipalName,jobTitle,accountEnabled,userType&$top=999';
  while (next) {
    const data = await api(next.replace(/^https:\/\/graph\.microsoft\.com\/v1\.0/, ''));
    for (const u of data.value || []) {
      if (u.accountEnabled === false || (u.userType && u.userType !== 'Member') || !u.mail) continue;
      people.push({ name: String(u.displayName || u.mail).replace(/\s*\|\s*TFA\b.*$/i, '').trim() || u.mail, mail: String(u.mail).toLowerCase(), upn: u.userPrincipalName, title: u.jobTitle || null });
    }
    next = data['@odata.nextLink'] || null;
  }
  people.sort((a, b) => a.name.localeCompare(b.name));
  fs.mkdirSync(path.dirname(PEOPLE_CACHE), { recursive: true });
  fs.writeFileSync(PEOPLE_CACHE, JSON.stringify({ at: new Date().toISOString(), people }, null, 2));
  return people;
}

/** The mailboxes a tool may read: the directory when scope is "tenant", else the named list. */
export async function mailboxScope() {
  const named = (cfg.mailboxes || []).map((m) => String(m).toLowerCase());
  if (cfg.scope === 'tenant') {
    // Union with the named list: a shared mailbox (accounts@) can be a disabled account in
    // the directory and would otherwise drop out of "everyone".
    try { const p = await directoryPeople(); if (p.length) return [...new Set([...named, ...p.map((x) => x.mail)])]; } catch (_) { /* named list below */ }
  }
  return configuredMailboxes();
}

/** Turn a Graph permission failure into the exact thing a person has to go and do. */
function consentError(e, permission, what) {
  if (e.status === 403 || e.status === 401) {
    const err = new Error(`Not permitted: ${what} needs the Graph application permission ${permission} with admin consent on the "TFA Agents" app registration. Everything else keeps working until then.`);
    err.needsConsent = permission;
    return err;
  }
  return e;
}

/* -------------------------------------------------------------------- search */

/** Free-text search across the configured mailboxes. Read-only. Mail.Read. */
export async function searchMail(query, { mailbox = null, top = 15 } = {}) {
  const boxes = mailbox ? [mailbox] : await mailboxScope();
  const out = [];
  for (const box of boxes) {
    try {
      const q = `/users/${encodeURIComponent(box)}/messages` +
        `?$search=${encodeURIComponent(`"${String(query).replace(/"/g, '')}"`)}` +
        `&$select=id,subject,from,toRecipients,receivedDateTime,bodyPreview,webLink&$top=${top}`;
      const data = await api(q, { headers: { ConsistencyLevel: 'eventual' } });
      for (const m of data.value || []) {
        out.push({
          mailbox: box, id: m.id, subject: m.subject,
          from: m.from?.emailAddress?.address || null,
          received: m.receivedDateTime, preview: (m.bodyPreview || '').slice(0, 200), link: m.webLink,
        });
      }
    } catch (e) {
      if (e.status !== 404) out.push({ mailbox: box, error: e.message });
    }
  }
  return out.sort((a, b) => String(b.received).localeCompare(String(a.received)));
}

/** Messages this mailbox SENT. The promise tracker's only input. Mail.Read. */
export async function sentMail(mailbox, { days = 14, top = 100 } = {}) {
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const data = await api(`/users/${encodeURIComponent(mailbox)}/mailFolders/sentitems/messages` +
    `?$filter=sentDateTime ge ${since}` +
    `&$select=id,subject,toRecipients,sentDateTime,bodyPreview,webLink&$orderby=sentDateTime desc&$top=${top}`);
  return (data.value || []).map((m) => ({
    id: m.id, subject: m.subject, sent: m.sentDateTime,
    to: (m.toRecipients || []).map((r) => r.emailAddress?.address).filter(Boolean),
    preview: m.bodyPreview || '', link: m.webLink,
  }));
}

/**
 * Sent messages WITH bodies, for the voice harvester. Paged, because a year of
 * someone's sent mail is more than one Graph page and a voice profile built from
 * the newest 100 emails is a profile of one busy fortnight.
 */
export async function sentMessagesFull(mailbox, { days = 540, max = 400 } = {}) {
  const since = new Date(Date.now() - days * 864e5).toISOString();
  let url = `/users/${encodeURIComponent(mailbox)}/mailFolders/sentitems/messages` +
    `?$filter=sentDateTime ge ${since}` +
    `&$select=id,subject,toRecipients,sentDateTime,conversationId,body,bodyPreview` +
    `&$orderby=sentDateTime desc&$top=100`;
  const out = [];
  // Graph returns bodies as HTML unless you ask otherwise, and HTML is not prose:
  // the tags get counted as words, sentence splitting collapses, and greetings and
  // sign-offs stop being detectable. Asking for text is the difference between a
  // voice profile and a measurement of someone's email client.
  const opts = { headers: { Prefer: 'outlook.body-content-type="text"' } };
  while (url && out.length < max) {
    const data = await api(url, opts);
    out.push(...(data.value || []));
    const next = data['@odata.nextLink'];
    url = next ? next.replace('https://graph.microsoft.com/v1.0', '') : null;
  }
  return out.slice(0, max);
}

/** One message in full, for drafting a reply against it. Mail.Read. */
export async function getMessage(mailbox, id) {
  // Text, not HTML — see sentMessagesFull. The drafter reads this body, and a
  // model handed a wall of Outlook markup writes worse replies than one handed prose.
  return api(`/users/${encodeURIComponent(mailbox)}/messages/${encodeURIComponent(id)}` +
    `?$select=id,subject,from,toRecipients,ccRecipients,receivedDateTime,body,webLink,conversationId`,
    { headers: { Prefer: 'outlook.body-content-type="text"' } });
}

/**
 * Metadata for everything a mailbox sent AND received in a window. No bodies.
 *
 * Deliberately metadata-only: this feeds workflow discovery, which is about SHAPE —
 * who, how often, what subject, was there an attachment — not content. Pulling
 * bodies for four mailboxes over six months would move a large amount of someone
 * else's mail around for no gain, and the shape is what the analysis actually reads.
 */
export async function mailboxTraffic(mailbox, { days = 120, max = 1500 } = {}) {
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const out = [];
  // Inbound is read across ALL FOLDERS, not just Inbox. Someone organised files mail
  // away as they deal with it, so mailFolders/inbox measures what is UNFILED, not
  // what arrived — for a tidy admin that reads as almost no incoming mail, which is
  // the opposite of the truth and would send the whole analysis the wrong way.
  // /messages spans every folder; sent items are excluded below by sender.
  const me = String(mailbox).toLowerCase();
  for (const [folderPath, dir, dateField] of [
    [`mailFolders/sentitems/messages`, 'out', 'sentDateTime'],
    [`messages`, 'in', 'receivedDateTime'],
  ]) {
    let url = `/users/${encodeURIComponent(mailbox)}/${folderPath}` +
      `?$filter=${dateField} ge ${since}` +
      `&$select=id,subject,from,toRecipients,${dateField},hasAttachments,conversationId` +
      `&$orderby=${dateField} desc&$top=200`;
    let got = 0;
    while (url && got < max / 2) {
      let data;
      try { data = await api(url); } catch (e) { if (e.status === 404) break; throw e; }
      for (const m of data.value || []) {
        const sender = (m.from?.emailAddress?.address || '').toLowerCase();
        // Their own messages come back in the all-folders query too. Skip them there,
        // or every sent email is counted twice and once in the wrong direction.
        if (dir === 'in' && sender === me) continue;
        out.push({
          dir,
          at: m[dateField],
          subject: m.subject || '(no subject)',
          from: m.from?.emailAddress?.address || null,
          to: (m.toRecipients || []).map((r) => r.emailAddress?.address).filter(Boolean),
          attachments: !!m.hasAttachments,
          thread: m.conversationId || null,
        });
        got++;
      }
      const next = data['@odata.nextLink'];
      url = next ? next.replace('https://graph.microsoft.com/v1.0', '') : null;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ calendar */

/** What is on. Needs Calendars.Read (application) — NOT yet consented for TFA. */
export async function calendarView(mailbox, { fromISO, toISO } = {}) {
  const start = fromISO || new Date().toISOString();
  const end = toISO || new Date(Date.now() + 7 * 864e5).toISOString();
  try {
    const data = await api(`/users/${encodeURIComponent(mailbox)}/calendarView` +
      `?startDateTime=${encodeURIComponent(start)}&endDateTime=${encodeURIComponent(end)}` +
      `&$select=subject,start,end,location,organizer,isAllDay,webLink&$orderby=start/dateTime&$top=50`,
      { headers: { Prefer: 'outlook.timezone="Australia/Brisbane"' } });
    return (data.value || []).map((e) => ({
      subject: e.subject, start: e.start?.dateTime, end: e.end?.dateTime,
      allDay: !!e.isAllDay, location: e.location?.displayName || null,
      organizer: e.organizer?.emailAddress?.name || null, link: e.webLink,
    }));
  } catch (e) {
    throw consentError(e, 'Calendars.Read', 'reading the calendar');
  }
}

/* -------------------------------------------------------------------- drafts */

/**
 * Create a REPLY DRAFT in the person's own Drafts folder. Needs Mail.ReadWrite
 * (application) — not yet consented for TFA.
 *
 * This is the only function in this file that writes to a mailbox, and all it can
 * write is a draft. There is deliberately no send path for anyone but agents@:
 * the last step is always a human in Outlook pressing send. That is the design,
 * not a limitation waiting to be removed.
 */
export async function createReplyDraft(mailbox, messageId, bodyText) {
  try {
    const draft = await api(`/users/${encodeURIComponent(mailbox)}/messages/${encodeURIComponent(messageId)}/createReply`, { method: 'POST' });
    await api(`/users/${encodeURIComponent(mailbox)}/messages/${encodeURIComponent(draft.id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ body: { contentType: 'Text', content: bodyText } }),
    });
    return { id: draft.id, link: draft.webLink || null };
  } catch (e) {
    throw consentError(e, 'Mail.ReadWrite', 'putting a draft in the mailbox');
  }
}

// ---- CLI (read-only commands; agents call these via Bash) ----
// Guarded to direct execution only: runner scripts import this module while
// holding their own argv (e.g. --manual), which must not reach the CLI parser.
const isEntry = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
const [, , cmd, ...args] = process.argv;
if (isEntry && cmd) {
  const out = (x) => console.log(JSON.stringify(x, null, 2));
  try {
    if (cmd === 'list-users') out(await listMailboxUsers());
    else if (cmd === 'mailboxes') out(configuredMailboxes());
    else if (cmd === 'search') {
      if (!args[0]) throw new Error('usage: search "<text>" [mailbox]');
      out(await searchMail(args[0], { mailbox: args[1] || null }));
    } else if (cmd === 'sent') {
      if (!args[0]) throw new Error('usage: sent <mailbox> [days]');
      out(await sentMail(args[0], { days: args[1] ? Number(args[1]) : 14 }));
    } else if (cmd === 'message') {
      if (!args[1]) throw new Error('usage: message <mailbox> <id>');
      out(await getMessage(args[0], args[1]));
    } else if (cmd === 'calendar') {
      if (!args[0]) throw new Error('usage: calendar <mailbox> [days]');
      const days = args[1] ? Number(args[1]) : 7;
      out(await calendarView(args[0], { toISO: new Date(Date.now() + days * 864e5).toISOString() }));
    }
    else if (cmd === 'search-from') {
      if (!args[0]) throw new Error('usage: search-from <address> [mailbox]');
      out(await searchFrom(args[0], args[1]));
    } else if (cmd === 'recent') {
      if (!args[0]) throw new Error('usage: recent <mailbox> [hours]');
      out(await recentInbox(args[0], args[1] ? Number(args[1]) : 24));
    } else if (cmd === 'token-check') { await getToken(); out({ ok: true }); }
    else throw new Error(`unknown command: ${cmd}. Available: mailboxes, search, search-from, recent, sent, message, calendar, list-users, token-check`);
  } catch (e) {
    console.error(String(e.message || e));
    process.exit(1);
  }
}
