import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getBackend } from '../campaign/backend'
import { CampaignError } from '../campaign/types'
import type { Campaign, CampaignEvent, CampaignRoll, CampaignSnapshot, PlayerSummary } from '../campaign/types'
import type { RollEntry } from '../engine/rolls'
import { jsonStorage } from './storage'

interface CampaignState {
    // Saved on this device
    displayName: string
    /** Which campaign each of your characters is playing in. */
    bindings: Record<string, string>
    /** Send your rolls to the GM only. */
    privateRolls: boolean
    /** GM recovery keys for campaigns you created. Keep them; they are also shown once at creation. */
    gmKeys: Record<string, string>
    lastCampaignId: string | null

    // This session
    phase: 'idle' | 'connecting' | 'ready' | 'error'
    error: string
    /** A problem sending something (the app keeps working). */
    notice: string
    userId: string
    campaigns: Campaign[]
    activeId: string | null
    snapshot: CampaignSnapshot | null

    setDisplayName: (name: string) => void
    setPrivateRolls: (value: boolean) => void
    connect: () => Promise<void>
    createCampaign: (name: string) => Promise<{ campaign: Campaign; gmKey: string }>
    joinCampaign: (code: string) => Promise<Campaign>
    claimGm: (code: string, gmKey: string) => Promise<Campaign>
    openCampaign: (id: string) => Promise<void>
    closeCampaign: () => void
    leaveCampaign: (id: string) => Promise<void>
    clearLog: () => Promise<void>
    removeMember: (userId: string) => Promise<void>
    bindCharacter: (characterId: string, campaignId: string | null) => void
    publishRoll: (characterId: string, entry: RollEntry) => void
    publishStatus: (campaignId: string, summary: PlayerSummary) => void
    gmRoll: (entry: RollEntry) => void
    dismissNotice: () => void
}

let stopListening: (() => void) | null = null
let connecting: Promise<void> | null = null

function messageOf(error: unknown): string {
    return error instanceof CampaignError ? error.message : error instanceof Error ? error.message : 'Something went wrong.'
}

export const useCampaignStore = create<CampaignState>()(
    persist(
        (set, get) => {
            const refresh = async () => {
                const id = get().activeId
                if (!id) return
                try {
                    set({ snapshot: await getBackend().load(id) })
                } catch (error) {
                    // Removed from the campaign, or it was deleted.
                    stopListening?.()
                    stopListening = null
                    set({ activeId: null, snapshot: null, notice: messageOf(error) })
                }
            }

            const onEvent = (event: CampaignEvent) => {
                const snapshot = get().snapshot
                if (event.type === 'roll' && snapshot) {
                    if (snapshot.rolls.some((roll: CampaignRoll) => roll.id === event.roll.id)) return
                    set({ snapshot: { ...snapshot, rolls: [event.roll, ...snapshot.rolls].slice(0, 200) } })
                } else {
                    void refresh()
                }
            }

            const reloadList = async () => set({ campaigns: await getBackend().listCampaigns() })

            const publish = async (task: () => Promise<void>) => {
                try {
                    await get().connect()
                    await task()
                } catch (error) {
                    set({ notice: `Could not reach your campaign: ${messageOf(error)}` })
                }
            }

            return {
                displayName: '',
                bindings: {},
                privateRolls: false,
                gmKeys: {},
                lastCampaignId: null,

                phase: 'idle',
                error: '',
                notice: '',
                userId: '',
                campaigns: [],
                activeId: null,
                snapshot: null,

                setDisplayName: (displayName) => set({ displayName }),
                setPrivateRolls: (privateRolls) => set({ privateRolls }),

                connect: () => {
                    if (get().phase === 'ready') return Promise.resolve()
                    if (connecting) return connecting

                    set({ phase: 'connecting', error: '' })
                    connecting = (async () => {
                        try {
                            const userId = await getBackend().init()
                            set({ userId, phase: 'ready', campaigns: await getBackend().listCampaigns() })
                        } catch (error) {
                            set({ phase: 'error', error: messageOf(error) })
                            throw error
                        } finally {
                            connecting = null
                        }
                    })()
                    return connecting
                },

                createCampaign: async (name) => {
                    await get().connect()
                    const result = await getBackend().createCampaign(name, get().displayName)
                    set({ gmKeys: { ...get().gmKeys, [result.campaign.id]: result.gmKey } })
                    await reloadList()
                    return result
                },

                joinCampaign: async (code) => {
                    await get().connect()
                    const campaign = await getBackend().joinCampaign(code, get().displayName)
                    await reloadList()
                    return campaign
                },

                claimGm: async (code, gmKey) => {
                    await get().connect()
                    const campaign = await getBackend().claimGm(code, gmKey.trim(), get().displayName)
                    set({ gmKeys: { ...get().gmKeys, [campaign.id]: gmKey.trim() } })
                    await reloadList()
                    return campaign
                },

                openCampaign: async (id) => {
                    await get().connect()
                    stopListening?.()
                    const snapshot = await getBackend().load(id)
                    set({ activeId: id, snapshot, lastCampaignId: id })
                    stopListening = getBackend().subscribe(id, onEvent)
                },

                closeCampaign: () => {
                    stopListening?.()
                    stopListening = null
                    set({ activeId: null, snapshot: null })
                },

                leaveCampaign: async (id) => {
                    await getBackend().leave(id)
                    if (get().activeId === id) get().closeCampaign()
                    const bindings = Object.fromEntries(Object.entries(get().bindings).filter(([, value]) => value !== id))
                    set({ bindings })
                    await reloadList()
                },

                clearLog: async () => {
                    const id = get().activeId
                    if (!id) return
                    await getBackend().clearRolls(id)
                    await refresh()
                },

                removeMember: async (userId) => {
                    const id = get().activeId
                    if (!id) return
                    await getBackend().removeMember(id, userId)
                    await refresh()
                },

                bindCharacter: (characterId, campaignId) => {
                    const bindings = { ...get().bindings }
                    if (campaignId) bindings[characterId] = campaignId
                    else delete bindings[characterId]
                    set({ bindings })
                },

                publishRoll: (characterId, entry) => {
                    const campaignId = get().bindings[characterId]
                    if (!campaignId) return
                    const { privateRolls, displayName } = get()
                    void publish(() => getBackend().publishRoll(campaignId, entry, privateRolls ? 'gm' : 'all', displayName || 'Player'))
                },

                publishStatus: (campaignId, summary) => {
                    void publish(() => getBackend().publishStatus(campaignId, summary))
                },

                gmRoll: (entry) => {
                    const id = get().activeId
                    if (!id) return
                    const { privateRolls, displayName } = get()
                    void publish(() => getBackend().publishRoll(id, entry, privateRolls ? 'gm' : 'all', displayName || 'GM'))
                },

                dismissNotice: () => set({ notice: '' }),
            }
        },
        {
            name: 'avatar-dnd:campaigns',
            version: 1,
            storage: jsonStorage,
            partialize: (state) => ({
                displayName: state.displayName,
                bindings: state.bindings,
                privateRolls: state.privateRolls,
                gmKeys: state.gmKeys,
                lastCampaignId: state.lastCampaignId,
            }),
        },
    ),
)
