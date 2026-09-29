/**
 * Working out what to copy between this device and the account. Pure: no storage, no network.
 *
 * Every item (a character or an NPC) has a time it was last changed. The newer side wins. A deletion
 * is remembered as a "tombstone" so it can reach the other device instead of the item coming back.
 */

/** What the account holds for one item. The data itself is fetched only for items we need. */
export interface RemoteItem {
    id: string
    deleted: boolean
    /** Milliseconds since 1970 of the last change. */
    updatedAt: number
}

export interface LocalItem {
    id: string
    /** When this account last changed it here, or null if the item is not in the account yet. */
    modifiedAt: number | null
}

export interface SyncPlan {
    /** Copy these from the account onto this device. */
    download: string[]
    /** Delete these from this device (they were deleted elsewhere, later than our last change). */
    removeLocal: string[]
    /** Send these to the account. */
    upload: string[]
    /** Tell the account these were deleted here. */
    uploadDeletes: Array<{ id: string; deletedAt: number }>
    /** Tombstones that no longer matter. */
    forgetTombstones: string[]
}

export function planSync(input: {
    local: LocalItem[]
    remote: RemoteItem[]
    /** id -> when it was deleted on this device, since the last time it was in the account. */
    tombstones: Record<string, number>
}): SyncPlan {
    const plan: SyncPlan = { download: [], removeLocal: [], upload: [], uploadDeletes: [], forgetTombstones: [] }
    const local = new Map(input.local.map((item) => [item.id, item]))
    const remote = new Map(input.remote.map((item) => [item.id, item]))

    for (const row of input.remote) {
        const here = local.get(row.id)
        const tombstone = input.tombstones[row.id]

        if (here && here.modifiedAt !== null) {
            if (row.updatedAt > here.modifiedAt) {
                if (row.deleted) plan.removeLocal.push(row.id)
                else plan.download.push(row.id)
            } else if (row.updatedAt < here.modifiedAt) {
                plan.upload.push(row.id)
            }
        } else if (here) {
            // On this device but not yet in the account: the account's copy is the one to keep.
            if (!row.deleted) plan.download.push(row.id)
        } else if (tombstone !== undefined) {
            if (tombstone >= row.updatedAt) {
                if (row.deleted) plan.forgetTombstones.push(row.id)
                else plan.uploadDeletes.push({ id: row.id, deletedAt: tombstone })
            } else {
                // Changed elsewhere after we deleted it here: bring it back.
                if (!row.deleted) plan.download.push(row.id)
                plan.forgetTombstones.push(row.id)
            }
        } else if (!row.deleted) {
            plan.download.push(row.id)
        }
    }

    for (const item of input.local) {
        if (item.modifiedAt !== null && !remote.has(item.id)) plan.upload.push(item.id)
    }
    for (const id of Object.keys(input.tombstones)) {
        // Never reached the account, so there is nothing to tell it.
        if (!remote.has(id) && !plan.forgetTombstones.includes(id)) plan.forgetTombstones.push(id)
    }

    return plan
}
