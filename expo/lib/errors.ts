// Supabase Auth errors (AuthError) extend the native Error class, but
// PostgREST/RPC errors (PostgrestError) are plain objects with a `message`
// field — `instanceof Error` silently fails for those. This handles both.
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return fallback;
}
