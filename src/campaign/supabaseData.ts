import type { SupabaseClient } from '@supabase/supabase-js'
import type { Character } from '../types/schema'
import { SAVED_BATCH, friendlyError, unwrap } from './supabaseMap'
import type { SavedRow } from './supabaseMap'
import type { SavedInfo, SavedItem, SavedKind, SavedUpload } from './types'

/** Campaign NPCs and the account's saved characters: the table calls behind SupabaseBackend. */

export async function saveCampaignNpc(
    client: SupabaseClient,
    campaignId: string,
    npc: { id: string; character: Character; revealed: boolean },
): Promise<void> {
    if (!npc.revealed) {
        // Realtime never announces an update that makes a row unreadable to a player, so a player's screen would keep
        // showing an NPC the GM just hid. Delete events do reach everyone, so hide by deleting, then saving it hidden.
        const removed = await client.from('campaign_npcs').delete().eq('campaign_id', campaignId).eq('id', npc.id)
        if (removed.error) throw friendlyError(removed.error)
    }
    const { error } = await client.from('campaign_npcs').upsert(
        {
            id: npc.id,
            campaign_id: campaignId,
            data: { character: npc.character },
            revealed: npc.revealed,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
    )
    if (error) throw friendlyError(error)
}

export async function deleteCampaignNpc(client: SupabaseClient, campaignId: string, npcId: string): Promise<void> {
    const { error } = await client.from('campaign_npcs').delete().eq('campaign_id', campaignId).eq('id', npcId)
    if (error) throw friendlyError(error)
}

export async function listSaved(client: SupabaseClient): Promise<SavedInfo[]> {
    const result = await client.from('user_characters').select('kind, id, deleted, updated_at').limit(5000)
    return unwrap(result as { data: SavedRow[] | null; error: null }).map((row) => ({
        kind: row.kind,
        id: row.id,
        deleted: row.deleted,
        updatedAt: Date.parse(row.updated_at),
    }))
}

export async function loadSaved(client: SupabaseClient, kind: SavedKind, ids: string[]): Promise<SavedItem[]> {
    const items: SavedItem[] = []
    for (let start = 0; start < ids.length; start += SAVED_BATCH) {
        const result = await client
            .from('user_characters')
            .select('kind, id, data')
            .eq('kind', kind)
            .in('id', ids.slice(start, start + SAVED_BATCH))
        items.push(...unwrap(result as { data: Array<{ kind: SavedKind; id: string; data: unknown }> | null; error: null }))
    }
    return items.filter((item) => item.data !== null)
}

export async function saveRows(client: SupabaseClient, rows: SavedUpload[]): Promise<void> {
    for (let start = 0; start < rows.length; start += SAVED_BATCH) {
        const batch = rows.slice(start, start + SAVED_BATCH).map((row) => ({
            kind: row.kind,
            id: row.id,
            data: row.deleted ? null : row.data,
            deleted: Boolean(row.deleted),
            updated_at: row.updatedAt,
        }))
        const { error } = await client.rpc('save_synced_characters', { p_rows: batch })
        if (error) throw friendlyError(error)
    }
}
