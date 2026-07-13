const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/gif': 'gif',
};

// Native picker/camera URIs aren't always a clean "name.ext" shape (e.g.
// iOS document-provider URIs, blob: URLs keyed by UUID) — splitting on "."
// to guess an extension silently produces garbage for those (confirmed
// live: a blob: URL with no dot got appended whole as the "extension").
// The blob's own MIME type is a far more reliable source; only fall back to
// URI-sniffing, capped to a short alnum token, if the type is unrecognized.
export function extensionFromBlob(blob: Blob, uri: string): string {
  if (blob.type && MIME_TO_EXT[blob.type]) return MIME_TO_EXT[blob.type];
  const fromUri = uri.split('.').pop()?.split('?')[0] ?? '';
  return /^[a-zA-Z0-9]{2,5}$/.test(fromUri) ? fromUri : 'jpg';
}
