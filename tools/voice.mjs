#!/usr/bin/env node
// Voice notes. Telegram hands the bridge an .oga (Opus) file; this turns it into text on
// this machine, nothing leaves the mini. Whisper (small, int8) runs through ONNX in Node;
// the model is fetched once into models/ (about 250 MB) and reused.
//
//   node tools/voice.mjs <file.oga|.ogg|.opus>     prints the transcript
//   node tools/voice.mjs --warm                    fetches the model so the first note is fast
//
// Ten seconds of speech takes about ten to twenty seconds on the mini. Longer notes are
// chunked by the model itself. English only unless VOICE_LANG is set.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODEL = process.env.VOICE_MODEL || 'onnx-community/whisper-small';
const LANG = process.env.VOICE_LANG || 'en';

const file = process.argv[2];
if (!file) { console.error('usage: node tools/voice.mjs <file.oga> | --warm'); process.exit(1); }

let transformers, OggOpusDecoder;
try {
  ({ OggOpusDecoder } = await import('ogg-opus-decoder'));
  transformers = await import('@huggingface/transformers');
} catch (e) {
  console.error('Not set up yet: run `npm install` in tariq-agent (Jaiah). ' + String(e.message || e).split('\n')[0]);
  process.exit(2);
}
transformers.env.cacheDir = process.env.VOICE_MODEL_DIR || path.join(ROOT, 'models');
transformers.env.allowLocalModels = true;

const t0 = Date.now();
const asr = await transformers.pipeline('automatic-speech-recognition', MODEL, { dtype: 'q8' });
if (file === '--warm') { console.log(`model ready (${MODEL}) in ${Date.now() - t0} ms`); process.exit(0); }

if (!fs.existsSync(file)) { console.error(`no such file: ${file}`); process.exit(1); }
const dec = new OggOpusDecoder();
await dec.ready;
let decoded;
try { decoded = await dec.decode(new Uint8Array(fs.readFileSync(file))); }
catch (e) { console.error(`could not read that audio (${String(e.message || e).split('\n')[0]}); only Telegram voice notes (Opus in Ogg) are supported`); process.exit(1); }
dec.free();
const { channelData, samplesDecoded, sampleRate } = decoded;
if (!samplesDecoded) { console.error('empty audio'); process.exit(1); }
let mono = channelData[0];
if (channelData.length > 1) {
  mono = new Float32Array(samplesDecoded);
  for (let i = 0; i < samplesDecoded; i++) { let s = 0; for (const c of channelData) s += c[i]; mono[i] = s / channelData.length; }
}
// Whisper wants 16 kHz mono. Opus decodes at 48 kHz; a linear resample is fine for speech.
const target = 16000, ratio = sampleRate / target, n = Math.floor(mono.length / ratio);
const pcm = new Float32Array(n);
for (let i = 0; i < n; i++) {
  const p = i * ratio, j = Math.floor(p), f = p - j;
  pcm[i] = mono[j] * (1 - f) + (mono[Math.min(j + 1, mono.length - 1)] || 0) * f;
}
const secs = samplesDecoded / sampleRate;
const r = await asr(pcm, { chunk_length_s: 30, stride_length_s: 5, language: LANG, task: 'transcribe' });
const text = String(r.text || '').replace(/\s+/g, ' ').trim();
if (!text) { console.error(`nothing heard in ${secs.toFixed(1)} s of audio`); process.exit(1); }
console.error(`${secs.toFixed(1)} s of audio, transcribed in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
console.log(text);
