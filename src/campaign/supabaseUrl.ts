/**
 * The Supabase dashboard shows several addresses. The app needs the bare project address
 * (https://<project>.supabase.co), but people often paste the database API address that ends in
 * /rest/v1/. Keep just the origin so either works.
 */
export function normalizeSupabaseUrl(value: string): string {
    const text = value.trim()
    try {
        return new URL(text).origin
    } catch {
        return text.replace(/\/+$/, '')
    }
}
