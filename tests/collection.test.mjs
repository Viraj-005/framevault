import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { encodeImage, decodeImage } from '../src/core/image-transfer.ts';
import { writeFile } from '../src/core/file-writer.ts';

test('image bytes survive a JSON message round trip and retain distinct hashes', async () => {
  const images = [Uint8Array.from([82, 73, 70, 70, 0, 255, 17]), Uint8Array.from([137, 80, 78, 71, 11, 254, 0])];
  const hashes = [];
  for (const bytes of images) {
    const payload = JSON.parse(JSON.stringify(encodeImage(bytes.buffer, 'image/webp')));
    const blob = decodeImage(payload);
    assert.deepEqual(new Uint8Array(await blob.arrayBuffer()), bytes);
    hashes.push(createHash('sha256').update(Buffer.from(await blob.arrayBuffer())).digest('hex'));
  }
  assert.notEqual(hashes[0], hashes[1]);
});

test('transfer rejects empty and truncated responses before saving', () => {
  assert.throws(() => decodeImage({ base64: '', byteLength: 0, mimeType: 'image/png' }), /empty or invalid/);
  assert.throws(() => decodeImage({ base64: 'AQ==', byteLength: 2, mimeType: 'image/png' }), /incomplete/);
});

test('file state conflicts abort the writer and reacquire a fresh handle', async () => {
  let handles = 0;
  let aborted = 0;
  let closed = 0;
  const directory = { async getFileHandle() {
    const attempt = ++handles;
    return { async createWritable() { return {
      async write() { if (attempt === 1) throw new DOMException('Changed on disk', 'InvalidStateError'); },
      async close() { closed++; },
      async abort() { aborted++; },
    }; } };
  } };
  await writeFile(directory, '001-frame.png', new Blob(['image']));
  assert.equal(handles, 2);
  assert.equal(aborted, 1);
  assert.equal(closed, 1);
});

test('persistent conflicts stop after three attempts; permission errors do not retry', async () => {
  for (const [name, expected] of [['InvalidStateError', 3], ['NotAllowedError', 1]]) {
    let attempts = 0;
    await assert.rejects(writeFile({ async getFileHandle() { attempts++; throw new DOMException('Busy', name); } }, 'frame.png', 'image'), { name });
    assert.equal(attempts, expected);
  }
});
