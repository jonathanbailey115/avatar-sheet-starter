import type { CampaignBackend, SavedUpload } from '../campaign/types'
import { loadStoredCharacters } from '../lib/characterLoad'
import type { RulesContent } from '../lib/normalize'
import type { Collection } from './collections'
import { planSync } from './plan'
import { buriedBy, ownedBy } from './syncStore'
import type { useSyncStore } from './syncStore'

export interface SyncDeps {
    backend: Pick<CampaignBackend, 'listSavedCharacters' | 'loadSavedCharacters' | 'saveCharacters'>
    collections: Collection[]
    store: typeof useSyncStore
    content: RulesContent
    /** Called with true while downloaded changes are being written, so they are not mistaken for edits. */
    applying: (active: boolean) => void
    /** Called after each collection is brought up to date, with its kind. */
    settled?: (collection: Collection) => void
}

export interface SyncResult {
    downloaded: number
    removed: number
    uploaded: number
    /** Downloaded records that could not be read and were skipped. */
    unreadable: number
}

/** One full pass for one account: download what is newer there, upload what is newer here. */
export async function runSync(userId: string, deps: SyncDeps): Promise<SyncResult> {
    const { backend, collections, store, content } = deps
    const result: SyncResult = { downloaded: 0, removed: 0, uploaded: 0, unreadable: 0 }
    const remote = await backend.listSavedCharacters()
    const uploads: SavedUpload[] = []

    for (const collection of collections) {
        const kind = collection.kind
        const owned = ownedBy(store.getState(), userId, kind)
        const tombstones = buriedBy(store.getState(), userId, kind)
        const remoteOfKind = remote.filter((item) => item.kind === kind)
        const remoteTime = new Map(remoteOfKind.map((item) => [item.id, item.updatedAt]))

        const plan = planSync({
            local: collection.all().map((item) => ({ id: item.id, modifiedAt: owned[item.id] ?? null })),
            remote: remoteOfKind,
            tombstones,
        })

        if (plan.download.length > 0) {
            const rows = await backend.loadSavedCharacters(kind, plan.download)
            const records = rows.map((row) => ({ ...(row.data as Record<string, unknown>), id: row.id }))
            const loaded = loadStoredCharacters(records, content)
            result.unreadable += loaded.quarantine.length
            result.downloaded += loaded.characters.length
            deps.applying(true)
            try {
                collection.put(loaded.characters)
            } finally {
                deps.applying(false)
            }
            for (const character of loaded.characters) {
                store.getState().touch(userId, kind, character.id, remoteTime.get(character.id) ?? Date.now())
            }
        }

        if (plan.removeLocal.length > 0) {
            deps.applying(true)
            try {
                collection.remove(plan.removeLocal)
            } finally {
                deps.applying(false)
            }
            store.getState().disown(userId, kind, plan.removeLocal)
            result.removed += plan.removeLocal.length
        }

        const byId = new Map(collection.all().map((item) => [item.id, item]))
        const nowOwned = ownedBy(store.getState(), userId, kind)
        for (const id of plan.upload) {
            const item = byId.get(id)
            if (item) uploads.push({ kind, id, data: item, updatedAt: nowOwned[id] ?? Date.now() })
        }
        for (const gone of plan.uploadDeletes) uploads.push({ kind, id: gone.id, deleted: true, updatedAt: gone.deletedAt })

        store.getState().forgetTombstones(userId, kind, plan.forgetTombstones)
        deps.settled?.(collection)
    }

    if (uploads.length > 0) await backend.saveCharacters(uploads)
    result.uploaded = uploads.length
    return result
}
