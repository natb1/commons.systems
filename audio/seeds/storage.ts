export interface StorageSeedItem {
  path: string;
  content: Buffer;
  metadata: Record<string, string>;
}

// Generates a minimal valid WAV file (RIFF/WAVE) with silence.
// 8 kHz, mono, 8-bit unsigned PCM. ~8 KB per second of audio.
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

const publicMeta = { publicDomain: "true" };
const testPrivateMeta = { publicDomain: "false", member_0: "test@example.com" };

const storageSeed: StorageSeedItem[] = [
  {
    path: "audio/prod/media/musopen-beethoven-moonlight.mp3",
    content: makeWav(1),
    metadata: publicMeta,
  },
  {
    path: "audio/prod/media/musopen-bach-cello-suite-1.mp3",
    content: makeWav(1),
    metadata: publicMeta,
  },
  {
    path: "audio/prod/media/musopen-chopin-nocturne-op9-2.mp3",
    content: makeWav(1),
    metadata: publicMeta,
  },
  {
    path: "audio/prod/media/test-audio-public.wav",
    content: makeWav(1),
    metadata: publicMeta,
  },
  {
    path: "audio/prod/media/test-audio-private.wav",
    content: makeWav(1),
    metadata: testPrivateMeta,
  },
];

export default storageSeed;
