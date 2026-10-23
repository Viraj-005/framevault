export interface ImagePayload {
  base64: string;
  byteLength: number;
  mimeType: string;
}

export function encodeImage(buffer: ArrayBuffer, mimeType: string): ImagePayload {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 32768) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 32768));
  }
  return { base64: btoa(binary), byteLength: bytes.length, mimeType };
}

export function decodeImage(payload: ImagePayload): Blob {
  if (typeof payload.base64 !== 'string' || !Number.isInteger(payload.byteLength) || payload.byteLength <= 0) {
    throw new Error('The image transfer was empty or invalid. Reload FrameVault and try again.');
  }
  const binary = atob(payload.base64);
  if (binary.length !== payload.byteLength) throw new Error('The image transfer was incomplete. Try this frame again.');
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: payload.mimeType });
}
