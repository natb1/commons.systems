import { TEST_USER } from "@commons-systems/authutil/seed";

import type { StorageSeedItem } from "@commons-systems/firebaseutil/seed-storage";

// Generates a minimal valid WAV file (RIFF/WAVE) with silence.
// 8 kHz, mono, 8-bit unsigned PCM. 8000 bytes per second of audio.
function makeWav(durationSeconds: number): Buffer {
  const sampleRate = 8000;
  const numSamples = sampleRate * durationSeconds;
  const dataSize = numSamples;
  const fileSize = 44 + dataSize;

  const buf = Buffer.alloc(fileSize);

  // RIFF header
  buf.write("RIFF", 0);
  buf.writeUInt32LE(fileSize - 8, 4);
  buf.write("WAVE", 8);

  // fmt  sub-chunk
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);       // sub-chunk size
  buf.writeUInt16LE(1, 20);        // PCM format
  buf.writeUInt16LE(1, 22);        // mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate, 28); // byte rate (sampleRate * 1 channel * 1 byte)
  buf.writeUInt16LE(1, 32);        // block align
  buf.writeUInt16LE(8, 34);        // bits per sample

  // data sub-chunk
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);
  // Fill with 0x80 (silence for unsigned 8-bit PCM)
  buf.fill(0x80, 44);

  return buf;
}

const publicMeta = { publicdomain: "true" };
const testPrivateMeta = { publicdomain: "false", member_0: TEST_USER.email };

// Public domain items have both a sourceUrl (real audio from Internet Archive)
// and a content stub (synthetic WAV). The seed script uses the stub in CI
// (SEED_TEST_ONLY=true) to avoid flaky external fetches, and the real audio
// in QA mode. Test-only items use stubs exclusively.
const storageSeed: StorageSeedItem[] = [
  {
    path: "audio/prod/media/musopen-beethoven-moonlight.mp3",
    sourceUrl: "https://archive.org/download/geniesduclassique_vol2no05/04%20Beethoven_%20Piano%20Sonata%20%2314%20In%20C%20Sharp%20Minor%2C%20Op.%2027_2%2C%20_Moonlight_%20-%201.%20Adagio%20Sostenuto.mp3",
    content: makeWav(1),
    metadata: publicMeta,
  },
  {
    path: "audio/prod/media/musopen-bach-cello-suite-1.mp3",
    sourceUrl: "https://archive.org/download/01No.1InGBwv10071.PreludeModerato/01%20No.1%20In%20G%20Bwv%201007_%201.%20Prelude%20%28Moderato%29.mp3",
    content: makeWav(1),
    metadata: publicMeta,
  },
  {
    path: "audio/prod/media/musopen-chopin-nocturne-op9-2.mp3",
    sourceUrl: "https://archive.org/download/musopen-chopin/Nocturne%20Op.%209%20no.%202%20in%20E%20flat%20major.mp3",
    content: makeWav(1),
    metadata: publicMeta,
  },
  {
    path: "audio/prod/media/test-audio-public.wav",
    content: makeWav(1),
    metadata: publicMeta,
    testOnly: true,
  },
  {
    path: "audio/prod/media/test-audio-private.wav",
    content: makeWav(1),
    metadata: testPrivateMeta,
    testOnly: true,
  },
];

export default storageSeed;
