/** Same rule as supabase/schema.sql: 3-20 characters, starts and ends with a letter or number. */
export const USERNAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_ .-]{1,18}[A-Za-z0-9]$/

export function usernameProblem(text: string): string | null {
    const value = text.trim()
    if (value === '') return 'Choose a username.'
    if (value.length < 3) return 'Usernames need at least 3 characters.'
    if (value.length > 20) return 'Usernames can be at most 20 characters.'
    if (!USERNAME_PATTERN.test(value)) {
        return 'Use letters, numbers, spaces, dots, dashes or underscores, starting and ending with a letter or number.'
    }
    return null
}

const MIN_PASSWORD = 8

export function passwordProblem(password: string): string | null {
    return password.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters.` : null
}

export function emailProblem(email: string): string | null {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) ? null : 'That does not look like an email address.'
}
