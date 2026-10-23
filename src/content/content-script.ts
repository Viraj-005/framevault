import type { ImageCandidate, Platform, ScanResponse } from '../core/types';

function detectPlatform(): Platform {
  const hostname = window.location.hostname;
  if (hostname.endsWith('behance.net')) return 'behance';
  if (hostname.endsWith('dribbble.com')) return 'dribbble';
  return 'unknown';
}

function readQuery(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('q') || params.get('search') || document.querySelector('input[type="search"]')?.getAttribute('value') || 'untitled-query';
}

function scanPage(): ScanResponse {
  const platform = detectPlatform();
  const images = Array.from(document.images).filter((image) => image.naturalWidth >= 160 && image.naturalHeight >= 120);
  const seenImageUrls = new Set<string>();
  const uniqueImages = images.filter((image) => {
    const imageUrl = image.currentSrc || image.src;
    if (!imageUrl || seenImageUrls.has(imageUrl)) return false;
    seenImageUrls.add(imageUrl);
    return true;
  });
  const candidates: ImageCandidate[] = uniqueImages.slice(0, 100).map((image, index) => {
    const anchor = image.closest('a');
    return {
      candidateId: `${platform}-${index}-${btoa(image.currentSrc || image.src).slice(0, 12)}`,
      platform,
      sourcePageUrl: window.location.href,
      sourcePageTitle: document.title,
      sourceItemUrl: anchor?.href,
      imageUrl: image.currentSrc || image.src,
      previewUrl: image.currentSrc || image.src,
      altText: image.alt || undefined,
      authorName: undefined,
      position: index + 1,
      selected: index < 12,
      extractionWarnings: [],
    };
  });
  return { kind: 'scan-response', platform, queryText: readQuery(), pageTitle: document.title, pageUrl: window.location.href, candidates };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'scan-page') {
    sendResponse(scanPage());
  }
  return true;
});
