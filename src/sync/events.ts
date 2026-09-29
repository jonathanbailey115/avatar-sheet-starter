import type { SavedKind } from '../campaign/types'

/**
 * Tells the account sync that this tab just created or imported characters. Only the tab that did
 * it announces, so a character made in one tab is never picked up by a different account signed in
 * to another tab of the same browser.
 */
type Listener = (kind: SavedKind, ids: string[]) => void

const listeners = new Set<Listener>()

export function onItemsAdded(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

export function announceAdded(kind: SavedKind, ids: string[]): void {
    if (ids.length === 0) return
    for (const listener of listeners) listener(kind, ids)
}
