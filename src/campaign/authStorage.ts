import type { SessionScope } from './types'

/**
 * Where a browser keeps its sign-in.
 *
 * 'device' (default): saved in localStorage, so you stay signed in here.
 * 'tab': saved in sessionStorage, private to this one tab. That is what lets a second account be
 * signed in at the same time in another tab of the same browser, to play two characters at once.
 * A tab-only sign-in ends when the tab is closed.
 */

const SCOPE_KEY = 'avatar-dnd:auth-scope'
const TAB_ID_KEY = 'avatar-dnd:auth-tab-id'

export interface AuthStorage {
    getItem(key: string): string | null
    setItem(key: string, value: string): void
    removeItem(key: string): void
}

function safe<T>(action: () => T, fallback: T): T {
    try {
        return action()
    } catch {
        return fallback
    }
}

export function currentScope(): SessionScope {
    return safe(() => sessionStorage.getItem(SCOPE_KEY) === 'tab', false) ? 'tab' : 'device'
}

export function rememberScope(scope: SessionScope): void {
    safe(() => {
        if (scope === 'tab') sessionStorage.setItem(SCOPE_KEY, 'tab')
        else sessionStorage.removeItem(SCOPE_KEY)
    }, undefined)
}

/**
 * Tabs must not share a storage key, or Supabase would announce one tab's sign-in to the others.
 * A random id, kept for the life of the tab, keeps them apart.
 */
export function storageKeyFor(projectRef: string, scope: SessionScope): string {
    if (scope === 'device') return `sb-${projectRef}-auth-token`

    let id = safe(() => sessionStorage.getItem(TAB_ID_KEY), null)
    if (!id) {
        id = globalThis.crypto.randomUUID()
        safe(() => sessionStorage.setItem(TAB_ID_KEY, id as string), undefined)
    }
    return `sb-${projectRef}-tab-${id}-auth-token`
}

export function authStorageFor(scope: SessionScope): AuthStorage {
    const area = () => (scope === 'tab' ? sessionStorage : localStorage)
    return {
        getItem: (key) => safe(() => area().getItem(key), null),
        setItem: (key, value) => safe(() => area().setItem(key, value), undefined),
        removeItem: (key) => safe(() => area().removeItem(key), undefined),
    }
}

/** The project ref is the first part of the Supabase host name. */
export function projectRefOf(url: string): string {
    try {
        return new URL(url).hostname.split('.')[0]
    } catch {
        return 'project'
    }
}
