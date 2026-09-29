import type { RollEntry } from '../engine/rolls'
import type { Character } from '../types/schema'
import { normalizeCode, randomCode } from './code'
import { CampaignError } from './types'
import type {
    Campaign,
    CampaignMember,
    CampaignNpc,
    CampaignRoll,
    CampaignSnapshot,
    MemberStatus,
    PlayerSummary,
    Visibility,
} from './types'

/**
 * The campaign rules in plain TypeScript. This powers local test mode and is the readable
 * specification of supabase/schema.sql (which enforces the same rules with row level security).
 */

interface StoredCampaign extends Campaign {
    gmKey: string
}

export interface ServerState {
    campaigns: StoredCampaign[]
    members: Array<CampaignMember & { campaignId: string }>
    rolls: Array<CampaignRoll & { campaignId: string }>
    statuses: Array<MemberStatus & { campaignId: string }>
    npcs: Array<CampaignNpc & { campaignId: string }>
}

export const emptyServerState = (): ServerState => ({ campaigns: [], members: [], rolls: [], statuses: [], npcs: [] })

const MAX_ROLLS = 500

const uuid = () => globalThis.crypto.randomUUID()

function cleanName(text: string, what: string, max: number): string {
    const value = text.trim()
    if (value === '') throw new CampaignError(`Choose ${what}.`)
    return value.slice(0, max)
}

export class CampaignServer {
    constructor(public state: ServerState = emptyServerState()) {}

    private campaign(id: string): StoredCampaign {
        const found = this.state.campaigns.find((item) => item.id === id)
        if (!found) throw new CampaignError('Campaign not found.')
        return found
    }

    private requireMember(userId: string, campaignId: string) {
        const member = this.state.members.find((item) => item.campaignId === campaignId && item.userId === userId)
        if (!member) throw new CampaignError('You are not in that campaign.')
        return member
    }

    private requireGm(userId: string, campaignId: string): void {
        if (this.campaign(campaignId).gmId !== userId) throw new CampaignError('Only the GM can do that.')
    }

    private byCode(code: string): StoredCampaign | undefined {
        const wanted = normalizeCode(code)
        return this.state.campaigns.find((item) => item.code === wanted)
    }

    private publicCampaign({ gmKey: _gmKey, ...campaign }: StoredCampaign): Campaign {
        return campaign
    }

    createCampaign(userId: string, name: string, displayName: string): { campaign: Campaign; gmKey: string } {
        const campaignName = cleanName(name, 'a campaign name', 80)
        const member = cleanName(displayName, 'a display name', 40)

        let code = randomCode()
        while (this.byCode(code)) code = randomCode()

        const stored: StoredCampaign = { id: uuid(), code, name: campaignName, gmId: userId, gmKey: uuid().replace(/-/g, '') }
        this.state.campaigns.push(stored)
        this.state.members.push({ campaignId: stored.id, userId, displayName: member, role: 'gm' })

        return { campaign: this.publicCampaign(stored), gmKey: stored.gmKey }
    }

    joinCampaign(userId: string, code: string, displayName: string): Campaign {
        const member = cleanName(displayName, 'a display name', 40)
        const found = this.byCode(code)
        if (!found) throw new CampaignError('No campaign with that code.')

        const existing = this.state.members.find((item) => item.campaignId === found.id && item.userId === userId)
        if (existing) existing.displayName = member
        else this.state.members.push({ campaignId: found.id, userId, displayName: member, role: 'player' })

        return this.publicCampaign(found)
    }

    claimGm(userId: string, code: string, gmKey: string, displayName: string): Campaign {
        const found = this.byCode(code)
        if (!found || found.gmKey !== gmKey) throw new CampaignError('That code and GM key do not match.')

        found.gmId = userId
        for (const member of this.state.members) {
            if (member.campaignId === found.id && member.role === 'gm') member.role = 'player'
        }

        const existing = this.state.members.find((item) => item.campaignId === found.id && item.userId === userId)
        if (existing) existing.role = 'gm'
        else this.state.members.push({ campaignId: found.id, userId, displayName: displayName.trim() || 'GM', role: 'gm' })

        return this.publicCampaign(found)
    }

    listCampaigns(userId: string): Campaign[] {
        return this.state.campaigns
            .filter((item) => this.state.members.some((m) => m.campaignId === item.id && m.userId === userId))
            .map((item) => this.publicCampaign(item))
    }

    canSee(roll: CampaignRoll, userId: string, campaignId: string): boolean {
        return roll.visibility === 'all' || roll.userId === userId || this.campaign(campaignId).gmId === userId
    }

    load(userId: string, campaignId: string): CampaignSnapshot {
        this.requireMember(userId, campaignId)
        const campaign = this.campaign(campaignId)

        return {
            campaign: this.publicCampaign(campaign),
            members: this.state.members
                .filter((item) => item.campaignId === campaignId)
                .map(({ campaignId: _id, ...member }) => member),
            statuses: this.state.statuses
                .filter((item) => item.campaignId === campaignId)
                .map(({ campaignId: _id, ...status }) => status),
            rolls: this.state.rolls
                .filter((item) => item.campaignId === campaignId && this.canSee(item, userId, campaignId))
                .map(({ campaignId: _id, ...roll }) => roll)
                .sort((a, b) => b.createdAt - a.createdAt),
            // The GM gets every NPC; players only the ones the GM revealed.
            npcs: this.state.npcs
                .filter((item) => item.campaignId === campaignId && (item.revealed || this.campaign(campaignId).gmId === userId))
                .map(({ campaignId: _id, ...npc }) => npc),
        }
    }

    publishRoll(userId: string, campaignId: string, entry: RollEntry, visibility: Visibility, displayName: string): CampaignRoll {
        this.requireMember(userId, campaignId)
        if (visibility !== 'all' && visibility !== 'gm') throw new CampaignError('Unknown roll visibility.')

        const roll: CampaignRoll = { id: uuid(), userId, displayName, visibility, entry, createdAt: Date.now() }
        this.state.rolls.push({ ...roll, campaignId })

        // Keep the log from growing forever.
        const mine = this.state.rolls.filter((item) => item.campaignId === campaignId)
        if (mine.length > MAX_ROLLS) {
            const drop = new Set(mine.slice(0, mine.length - MAX_ROLLS).map((item) => item.id))
            this.state.rolls = this.state.rolls.filter((item) => !drop.has(item.id))
        }
        return roll
    }

    clearStatus(userId: string, campaignId: string): void {
        this.requireMember(userId, campaignId)
        this.state.statuses = this.state.statuses.filter((item) => !(item.campaignId === campaignId && item.userId === userId))
    }

    publishStatus(userId: string, campaignId: string, summary: PlayerSummary): void {
        this.requireMember(userId, campaignId)
        const existing = this.state.statuses.find((item) => item.campaignId === campaignId && item.userId === userId)
        if (existing) {
            existing.summary = summary
            existing.updatedAt = Date.now()
        } else {
            this.state.statuses.push({ campaignId, userId, summary, updatedAt: Date.now() })
        }
    }

    saveNpc(userId: string, campaignId: string, npc: { id: string; character: Character; revealed: boolean }): void {
        this.requireGm(userId, campaignId)
        const stored = { campaignId, id: npc.id, character: npc.character, revealed: npc.revealed, updatedAt: Date.now() }
        const index = this.state.npcs.findIndex((item) => item.campaignId === campaignId && item.id === npc.id)
        if (index >= 0) this.state.npcs[index] = stored
        else this.state.npcs.push(stored)
    }

    deleteNpc(userId: string, campaignId: string, npcId: string): void {
        this.requireGm(userId, campaignId)
        this.state.npcs = this.state.npcs.filter((item) => !(item.campaignId === campaignId && item.id === npcId))
    }

    clearRolls(userId: string, campaignId: string): void {
        this.requireGm(userId, campaignId)
        this.state.rolls = this.state.rolls.filter((item) => item.campaignId !== campaignId)
    }

    leave(userId: string, campaignId: string): void {
        this.state.members = this.state.members.filter((item) => !(item.campaignId === campaignId && item.userId === userId))
        this.state.statuses = this.state.statuses.filter((item) => !(item.campaignId === campaignId && item.userId === userId))
    }

    removeMember(userId: string, campaignId: string, targetUserId: string): void {
        this.requireGm(userId, campaignId)
        this.leave(targetUserId, campaignId)
    }
}
