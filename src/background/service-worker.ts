import { encodeImage, type ImagePayload } from '../core/image-transfer';

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'ping') sendResponse({ ok: true, name: 'FrameVault' });
  if (message?.type === 'fetch-image' && typeof message.imageUrl === 'string') {
    void fetchImage(message.imageUrl).then(sendResponse).catch((error) => {
      sendResponse({ ok: false, status: 0, error: error instanceof Error ? error.message : 'Image request failed.' });
    });
  }
  return true;
});

async function fetchImage(imageUrl: string): Promise<({ ok: true; status: number } & ImagePayload) | { ok: false; status: number; error: string }> {
  const url = new URL(imageUrl);
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !isAllowedImageHost(url.hostname)) {
    return { ok: false, status: 0, error: 'The image host is outside the approved platform policy.' };
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) return { ok: false, status: response.status, error: `Image request returned ${response.status}.` };
  const mimeType = response.headers.get('content-type') || 'application/octet-stream';
  if (!mimeType.startsWith('image/')) return { ok: false, status: response.status, error: 'The response was not an image.' };
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > 25 * 1024 * 1024) return { ok: false, status: response.status, error: 'Image exceeds the 25 MiB size limit.' };
  if (!buffer.byteLength) return { ok: false, status: response.status, error: 'The image response was empty.' };
  return { ok: true, status: response.status, ...encodeImage(buffer, mimeType) };
}

function isAllowedImageHost(hostname: string): boolean {
  const value = hostname.toLowerCase();
  return value === 'behance.net' || value.endsWith('.behance.net') || value === 'dribbble.com' || value.endsWith('.dribbble.com');
}
