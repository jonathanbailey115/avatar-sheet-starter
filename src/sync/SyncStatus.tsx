import { ConfirmButton } from '../components/ConfirmButton'
import type { SavedKind } from '../campaign/types'
import { useCampaignStore } from '../store/campaign'
import { useLibraryStore } from '../store/library'
import { useNpcStore } from '../store/npcs'
import { adoptDeviceCharacters, countOutsideAccount, syncNow } from './cloudSync'
import { useSyncStore } from './syncStore'

const time = (at: number) => new Date(at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

/** Shows whether this account's characters are saved, and offers to add the ones already on this device. */
export function SyncStatus() {
    const userId = useCampaignStore((state) => state.userId)
    const username = useCampaignStore((state) => state.account?.username)
    const { status, message, lastSyncedAt, owned } = useSyncStore()
    const characters = useLibraryStore((state) => state.characters)
    const npcs = useNpcStore((state) => state.npcs)

    if (!userId || !username || status === 'off') return null

    const outside = countOutsideAccount(userId, owned, { character: characters, npc: npcs })
    const mine = owned[userId]
    const inAccount = Object.keys(mine?.character ?? {}).length + Object.keys(mine?.npc ?? {}).length
    const waiting = outside.character + outside.npc

    return (
        <div className="sync-status" role="status">
            <p>
                {status === 'syncing' && 'Saving your characters…'}
                {status === 'idle' &&
                    `Your characters are saved to your account${lastSyncedAt ? ` (last synced ${time(lastSyncedAt)})` : ''}. ${inAccount} in your account.`}
                {status === 'error' && `Could not sync your characters: ${message} Trying again soon.`}{' '}
                <button className="link-button" type="button" onClick={() => void syncNow()} disabled={status === 'syncing'}>
                    Sync now
                </button>
            </p>
            {status === 'idle' && message && <p className="roll-error">{message}</p>}
            {waiting > 0 && (
                <p>
                    {outside.character > 0 && `${outside.character} character${outside.character === 1 ? '' : 's'}`}
                    {outside.character > 0 && outside.npc > 0 && ' and '}
                    {outside.npc > 0 && `${outside.npc} NPC${outside.npc === 1 ? '' : 's'}`} on this device{' '}
                    {waiting === 1 ? 'is' : 'are'} not in your account, so {waiting === 1 ? 'it' : 'they'} will not follow you to other devices.{' '}
                    <ConfirmButton
                        className="secondary-button"
                        question={`Add ${waiting === 1 ? 'it' : 'them'} to ${username}'s account?`}
                        onConfirm={() => void adoptDeviceCharacters()}
                    >
                        Add to my account
                    </ConfirmButton>
                </p>
            )}
        </div>
    )
}

/** A small tag on a character card: is it in the signed-in account? Shows nothing when signed out. */
export function SavedBadge({ kind, id }: { kind: SavedKind; id: string }) {
    const userId = useCampaignStore((state) => state.userId)
    const enabled = useCampaignStore((state) => state.phase === 'ready' && Boolean(state.account?.username))
    const status = useSyncStore((state) => state.status)
    const inAccount = useSyncStore((state) => userId !== '' && state.owned[userId]?.[kind]?.[id] !== undefined)

    if (!enabled || status === 'off') return null
    return (
        <small className={inAccount ? 'saved-badge' : 'saved-badge saved-badge-local'}>
            {inAccount ? 'In your account' : 'Only on this device'}
        </small>
    )
}
