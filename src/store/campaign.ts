import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { cameFromPasswordRecoveryLink, getBackend } from '../campaign/backend'
import { CampaignError } from '../campaign/types'
import type { AccountSession, CampaignEvent, CampaignRoll } from '../campaign/types'
import type { CampaignState } from './campaignState'
import { jsonStorage } from './storage'

let stopListening: (() => void) | null = null
let connecting: Promise<void> | null = null

function messageOf(error: unknown): string {
    return error instanceof CampaignError ? error.message : error instanceof Error ? error.message : 'Something went wrong.'
}

const NO_BINDINGS: Record<string, string> = {}

/** The name other players see: the account's username, or the test-mode display name. */
export function nameFor(state: Pick<CampaignState, 'account' | 'displayName'>): string {
    return state.account?.username || state.displayName
}

/** Which campaign (if any) a character is playing in, for the account signed in on this tab. */
export function boundCampaign(state: Pick<CampaignState, 'bindings' | 'userId'>, characterId: string): string | undefined {
    return (state.bindings[state.userId] ?? NO_BINDINGS)[characterId]
}

export function myBindings(state: Pick<CampaignState, 'bindings' | 'userId'>): Record<string, string> {
    return state.bindings[state.userId] ?? NO_BINDINGS
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

            /** Start a session: remember who this is and load their campaigns. */
            const enter = async (account: AccountSession) => {
                set({ account, userId: account.userId, phase: 'ready', error: '', campaigns: await getBackend().listCampaigns() })
            }

            const publish = async (task: () => Promise<void>) => {
                try {
                    await get().connect()
                    if (get().phase !== 'ready') return // signed out: nothing to send to
                    await task()
                } catch (error) {
                    set({ notice: `Could not reach your campaign: ${messageOf(error)}` })
                }
            }

            const forget = () => {
                stopListening?.()
                stopListening = null
                set({ account: null, userId: '', campaigns: [], activeId: null, snapshot: null })
            }

            let watching = false
            /** If the sign-in disappears (signed out in another tab), show the sign-in screen. */
            const watchSignOut = () => {
                if (watching) return
                watching = true
                getBackend().onSignedOut(() => {
                    if (get().phase !== 'ready') return
                    forget()
                    set({ phase: 'signed-out', notice: 'You were signed out. Sign in again to continue.' })
                })
            }

            return {
                displayName: '',
                bindings: {},
                gmKeys: {},

                privateRolls: false,
                phase: 'idle',
                error: '',
                notice: '',
                account: null,
                userId: '',
                campaigns: [],
                activeId: null,
                snapshot: null,

                setDisplayName: (displayName) => set({ displayName }),
                setPrivateRolls: (privateRolls) => set({ privateRolls }),

                connect: () => {
                    if (get().phase === 'ready' || get().phase === 'signed-out' || get().phase === 'recovering') {
                        return Promise.resolve()
                    }
                    if (connecting) return connecting

                    set({ phase: 'connecting', error: '' })
                    connecting = (async () => {
                        try {
                            watchSignOut()
                            const session = await getBackend().init()
                            if (!session) {
                                set({ phase: 'signed-out', account: null, userId: '' })
                            } else if (cameFromPasswordRecoveryLink()) {
                                set({ account: session, userId: session.userId, phase: 'recovering' })
                            } else {
                                await enter(session)
                            }
                        } catch (error) {
                            set({ phase: 'error', error: messageOf(error) })
                            throw error
                        } finally {
                            connecting = null
                        }
                    })()
                    return connecting
                },

                signUp: async (input, scope) => {
                    const backend = getBackend()
                    backend.setSessionScope(scope)
                    const result = await backend.signUp(input)
                    if (result.status === 'confirm-email') return 'confirm-email'
                    await enter(result.session)
                    return 'signed-in'
                },

                signIn: async (email, password, scope) => {
                    const backend = getBackend()
                    backend.setSessionScope(scope)
                    await enter(await backend.signIn(email, password))
                },

                switchAccountHere: () => {
                    getBackend().setSessionScope('tab')
                    forget()
                    set({ phase: 'signed-out' })
                },

                signOut: async () => {
                    await getBackend().signOut()
                    forget()
                    set({ phase: 'signed-out' })
                },

                setUsername: async (username) => {
                    const saved = await getBackend().setUsername(username)
                    const account = get().account
                    if (account) set({ account: { ...account, username: saved } })
                    if (get().activeId) await refresh()
                },

                changePassword: (newPassword) => getBackend().changePassword(newPassword),

                finishRecovery: async (newPassword) => {
                    await getBackend().changePassword(newPassword)
                    const account = get().account
                    if (account) await enter(account)
                },

                createCampaign: async (name) => {
                    await get().connect()
                    const result = await getBackend().createCampaign(name, nameFor(get()))
                    set({ gmKeys: { ...get().gmKeys, [result.campaign.id]: result.gmKey } })
                    await reloadList()
                    return result
                },

                joinCampaign: async (code) => {
                    await get().connect()
                    const campaign = await getBackend().joinCampaign(code, nameFor(get()))
                    await reloadList()
                    return campaign
                },

                claimGm: async (code, gmKey) => {
                    await get().connect()
                    const campaign = await getBackend().claimGm(code, gmKey.trim(), nameFor(get()))
                    set({ gmKeys: { ...get().gmKeys, [campaign.id]: gmKey.trim() } })
                    await reloadList()
                    return campaign
                },

                openCampaign: async (id) => {
                    await get().connect()
                    stopListening?.()
                    const snapshot = await getBackend().load(id)
                    set({ activeId: id, snapshot })
                    stopListening = getBackend().subscribe(id, onEvent)
                },

                reload: refresh,

                closeCampaign: () => {
                    stopListening?.()
                    stopListening = null
                    set({ activeId: null, snapshot: null })
                },

                leaveCampaign: async (id) => {
                    await getBackend().leave(id)
                    if (get().activeId === id) get().closeCampaign()
                    const mine = Object.fromEntries(Object.entries(myBindings(get())).filter(([, value]) => value !== id))
                    set({ bindings: { ...get().bindings, [get().userId]: mine } })
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
                    const userId = get().userId
                    if (!userId) return
                    const mine = { ...myBindings(get()) }
                    if (campaignId) mine[characterId] = campaignId
                    else delete mine[characterId]
                    set({ bindings: { ...get().bindings, [userId]: mine } })
                },

                publishRoll: (characterId, entry) => {
                    const campaignId = boundCampaign(get(), characterId)
                    if (!campaignId) return
                    const { privateRolls } = get()
                    void publish(() => getBackend().publishRoll(campaignId, entry, privateRolls ? 'gm' : 'all', nameFor(get()) || 'Player'))
                },

                publishStatus: (campaignId, summary) => {
                    void publish(() => getBackend().publishStatus(campaignId, summary))
                },

                gmRoll: (entry) => {
                    const id = get().activeId
                    if (!id) return
                    const { privateRolls } = get()
                    void publish(() => getBackend().publishRoll(id, entry, privateRolls ? 'gm' : 'all', nameFor(get()) || 'GM'))
                },

                dismissNotice: () => set({ notice: '' }),
            }
        },
        {
            name: 'avatar-dnd:campaigns',
            version: 2,
            storage: jsonStorage,
            // Older saves keyed bindings by character only. They belonged to guest sign-ins that no longer exist.
            migrate: (persisted, version) => {
                const saved = (persisted ?? {}) as Partial<CampaignState>
                return version < 2 ? { displayName: saved.displayName ?? '', bindings: {}, gmKeys: saved.gmKeys ?? {} } : saved
            },
            partialize: (state) => ({
                displayName: state.displayName,
                bindings: state.bindings,
                gmKeys: state.gmKeys,
            }),
        },
    ),
)
