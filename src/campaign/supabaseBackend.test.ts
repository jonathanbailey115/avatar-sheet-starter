import { describe, expect, it } from 'vitest'
import { campaignFromRow, friendlyError, memberFromRow, rollFromRow, statusFromRow } from './supabaseMap'

describe('row mapping', () => {
    it('maps a campaign', () => {
        expect(campaignFromRow({ id: 'c', code: 'ABCD1234', name: 'Siege', gm_id: 'g' })).toEqual({
            id: 'c',
            code: 'ABCD1234',
            name: 'Siege',
            gmId: 'g',
        })
    })

    it('maps a member', () => {
        expect(memberFromRow({ user_id: 'u', display_name: 'Bob', role: 'player' })).toEqual({
            userId: 'u',
            displayName: 'Bob',
            role: 'player',
        })
    })

    it('turns timestamps into milliseconds', () => {
        const status = statusFromRow({
            user_id: 'u',
            summary: { hp: 3 } as never,
            updated_at: '2026-01-02T03:04:05.000Z',
        })
        expect(status.updatedAt).toBe(Date.UTC(2026, 0, 2, 3, 4, 5))

        const roll = rollFromRow({
            id: 'r',
            user_id: 'u',
            display_name: 'Bob',
            visibility: 'gm',
            entry: { label: 'x' } as never,
            created_at: '2026-01-02T03:04:05.000Z',
        })
        expect(roll).toMatchObject({ userId: 'u', displayName: 'Bob', visibility: 'gm', createdAt: Date.UTC(2026, 0, 2, 3, 4, 5) })
    })
})

describe('friendlyError', () => {
    it('explains the most common setup mistake', () => {
        expect(friendlyError({ message: 'Anonymous sign-ins are disabled' }).message).toMatch(/Authentication > Providers/)
    })

    it('tells you to re-run the setup when a newer table is missing', () => {
        expect(friendlyError({ message: "Could not find the table 'public.user_characters' in the schema cache" }).message).toMatch(/schema.sql/)
        expect(friendlyError({ message: 'Could not find the function public.save_synced_characters(p_rows) in the schema cache' }).message).toMatch(/schema.sql/)
    })

    it('explains being offline', () => {
        expect(friendlyError({ message: 'TypeError: Failed to fetch' }).message).toMatch(/Could not reach/)
    })

    it('explains a permission failure without database jargon', () => {
        const message = friendlyError({ message: 'new row violates row-level security policy for table "campaign_rolls"' }).message
        expect(message).toBe('You are not allowed to do that in this campaign.')
        expect(message).not.toMatch(/row-level/)
    })

    it('passes through the readable messages the database functions raise', () => {
        expect(friendlyError({ message: 'No campaign with that code' }).message).toBe('No campaign with that code')
    })

    it('copes with a missing error', () => {
        expect(friendlyError(null).message).toBe('Something went wrong.')
    })
})
