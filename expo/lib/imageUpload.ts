import { Platform } from 'react-native';
// expo-file-system's default export throws on uploadAsync/FileSystemUploadType
// in this SDK version (rewritten API) — the pre-rewrite functions this file
// needs still live under the /legacy subpath.
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '@/lib/supabase';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/gif': 'gif',
};

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  gif: 'image/gif',
};

// Native picker/camera URIs aren't always a clean "name.ext" shape (e.g.
// iOS document-provider URIs, blob: URLs keyed by UUID) — splitting on "."
// to guess an extension silently produces garbage for those (confirmed
// live: a blob: URL with no dot got appended whole as the "extension").
// The blob's own MIME type is a far more reliable source; only fall back to
// URI-sniffing, capped to a short alnum token, if the type is unrecognized.
export function extensionFromBlob(blob: Blob, uri: string): string {
  if (blob.type && MIME_TO_EXT[blob.type]) return MIME_TO_EXT[blob.type];
  return extensionFromUri(uri);
}

// Same URI-sniffing fallback as extensionFromBlob, for call sites that pick
// the upload path before (or without ever) fetching a blob — deliberately
// used instead of a blob-derived extension on native, since fetching a blob
// at all is exactly the step that was silently producing 0-byte uploads.
export function extensionFromUri(uri: string): string {
  const fromUri = uri.split('.').pop()?.split('?')[0] ?? '';
  return /^[a-zA-Z0-9]{2,5}$/.test(fromUri) ? fromUri : 'jpg';
}

// Uploads a local image URI to a Supabase Storage bucket, returning its
// public URL. On native this deliberately avoids `fetch(uri).then(r =>
// r.blob())` — confirmed live to silently produce a 0-byte blob for some
// picked-image file:// URIs (the upload "succeeds" with a 200, but the
// stored object has content-length: 0, so it never renders). Hermes/React
// Native's fetch+Blob polyfill just isn't as reliable here as a real
// browser's. FileSystem.uploadAsync streams the file straight from disk via
// native networking instead, sidestepping that failure mode entirely. Web
// keeps the fetch/blob path since it's a real Blob implementation there and
// was verified to preserve bytes correctly.
export async function uploadImageAsync(bucket: string, path: string, uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
      contentType: blob.type || 'image/jpeg',
    });
    if (error) throw error;
  } else {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Not signed in');

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const contentType = EXT_TO_MIME[path.split('.').pop()?.toLowerCase() ?? ''] ?? 'image/jpeg';
    const result = await FileSystem.uploadAsync(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, uri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType,
      },
    });
    if (result.status < 200 || result.status >= 300) {
      throw new Error(`Upload failed (${result.status}): ${result.body.slice(0, 200)}`);
    }
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
