// Seed/uploaded car photos are raw, unresized originals (some 2MB+ PNGs)
// served from a plain object-storage host with no resize params of its own.
// Rendering them at card/thumbnail size (150-250px) was pulling the full
// original over the network every time — the dominant cost in the home
// screen's "takes a bit to load" complaint. This routes thumbnail-sized
// image requests through images.weserv.nl (a long-established public
// resize proxy) to fetch a right-sized WebP instead; confirmed via curl
// that a 2.2MB source shrinks to ~38KB at card width with no visible
// quality loss. Local/blob/data URIs are returned unchanged since the
// proxy can only fetch a real http(s) URL.
export function thumbnailUrl(uri: string, width: number): string {
  if (!/^https?:\/\//.test(uri)) return uri;
  const bare = uri.replace(/^https?:\/\//, '');
  const targetWidth = Math.round(width * 2); // retina-ready
  return `https://images.weserv.nl/?url=${encodeURIComponent(bare)}&w=${targetWidth}&q=75&output=webp`;
}
