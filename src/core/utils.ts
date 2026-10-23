export function slugify(value: string): string {
  const clean = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return clean || 'untitled-query';
}

export function safeFilename(position: number, sourceUrl: string, mimeType?: string): string {
  const extension = mimeType?.split('/')[1]?.replace('jpeg', 'jpg') ||
    new URL(sourceUrl).pathname.split('.').pop()?.toLowerCase() || 'bin';
  const safeExtension = /^[a-z0-9]{2,5}$/.test(extension) ? extension : 'bin';
  return `${String(position).padStart(3, '0')}-frame.${safeExtension}`;
}

export function csvEscape(value: unknown): string {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export async function sha256(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest)).map((part) => part.toString(16).padStart(2, '0')).join('');
}

export function isSafeImageUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && !isPrivateHostname(url.hostname);
  } catch {
    return false;
  }
}

function isPrivateHostname(hostname: string): boolean {
  const value = hostname.toLowerCase();
  return value === 'localhost' || value === '127.0.0.1' || value === '::1' || value.endsWith('.local') || value.startsWith('10.') || value.startsWith('192.168.');
}
