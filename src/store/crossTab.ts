import { useCampaignStore } from './campaign'
import { useContentStore } from './content'
import { useLibraryStore } from './library'
import { useNpcStore } from './npcs'

/**
 * Several tabs can be open on one device (for instance two accounts playing two characters).
 * They share saved data, so when one tab saves, the others reload it. Without this, a tab
 * would later save its older copy over the newer one.
 */
const STORES: Record<string, { persist: { rehydrate: () => Promise<void> | void } }> = {
    'avatar-dnd:library': useLibraryStore,
    'avatar-dnd:npcs': useNpcStore,
    'avatar-dnd:content': useContentStore,
    'avatar-dnd:campaigns': useCampaignStore,
}

export function startCrossTabSync(): void {
    window.addEventListener('storage', (event) => {
        if (event.storageArea !== localStorage || !event.key) return
        void STORES[event.key]?.persist.rehydrate()
    })
}
