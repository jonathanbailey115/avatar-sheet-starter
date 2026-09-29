import { describe, expect, it } from 'vitest'
import { emailProblem, passwordProblem, usernameProblem } from './username'

describe('usernameProblem', () => {
    it('accepts good names', () => {
        for (const name of ['Toph', 'Aang_99', 'Fire Lord Ozai', 'a.b-c', 'Sok', 'x'.repeat(20)]) {
            expect(usernameProblem(name), name).toBeNull()
        }
    })

    it('rejects names that are empty, short, long or oddly shaped', () => {
        expect(usernameProblem('')).toMatch(/Choose/)
        expect(usernameProblem('  ')).toMatch(/Choose/)
        expect(usernameProblem('ab')).toMatch(/at least 3/)
        expect(usernameProblem('x'.repeat(21))).toMatch(/at most 20/)
        expect(usernameProblem('-bad')).toMatch(/starting and ending/)
        expect(usernameProblem('bad_')).toMatch(/starting and ending/)
        expect(usernameProblem('no@symbols')).toMatch(/letters, numbers/)
    })

    it('ignores surrounding spaces, like the database does', () => {
        expect(usernameProblem('  Toph  ')).toBeNull()
    })
})

describe('passwordProblem and emailProblem', () => {
    it('needs 8 characters', () => {
        expect(passwordProblem('1234567')).toMatch(/at least 8/)
        expect(passwordProblem('12345678')).toBeNull()
    })

    it('checks the shape of an email', () => {
        expect(emailProblem('a@b.co')).toBeNull()
        expect(emailProblem(' a@b.co ')).toBeNull()
        expect(emailProblem('nope')).toMatch(/email/)
        expect(emailProblem('a@b')).toMatch(/email/)
    })
})
