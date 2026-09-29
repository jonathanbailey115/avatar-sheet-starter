/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Supabase project URL (Settings -> API). Leave unset to use local test mode. */
    readonly VITE_SUPABASE_URL?: string
    /** Supabase anon (public) key. Safe to ship in the app; the database rules protect the data. */
    readonly VITE_SUPABASE_ANON_KEY?: string
}
