import { useState } from 'react'

/** Run an async action and keep its error message and busy state for display. */
export function useAction() {
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    const run = async <T,>(task: () => Promise<T>): Promise<T | undefined> => {
        setBusy(true)
        setError('')
        try {
            return await task()
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'Something went wrong.')
            return undefined
        } finally {
            setBusy(false)
        }
    }

    return { error, busy, run, setError }
}
