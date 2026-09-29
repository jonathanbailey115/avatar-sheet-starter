import { describe, expect, it } from 'vitest'
import { normalizeSupabaseUrl } from './supabaseUrl'

describe('normalizeSupabaseUrl', () => {
    it('leaves a correct project URL alone', () => {
        expect(normalizeSupabaseUrl('https://abc.supabase.co')).toBe('https://abc.supabase.co')
    })

    it('strips the /rest/v1/ path people paste from the API settings', () => {
        expect(normalizeSupabaseUrl('https://abc.supabase.co/rest/v1/')).toBe('https://abc.supabase.co')
        expect(normalizeSupabaseUrl('https://abc.supabase.co/rest/v1')).toBe('https://abc.supabase.co')
    })

    it('strips a trailing slash and whitespace', () => {
        expect(normalizeSupabaseUrl('  https://abc.supabase.co/  ')).toBe('https://abc.supabase.co')
    })

    it('does not crash on something that is not a URL', () => {
        expect(normalizeSupabaseUrl('abc.supabase.co/')).toBe('abc.supabase.co')
        expect(normalizeSupabaseUrl('')).toBe('')
    })
})
