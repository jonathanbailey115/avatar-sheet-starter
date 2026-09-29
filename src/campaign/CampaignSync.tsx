import { useEffect, useRef } from 'react'
import { computeSheet } from '../engine/sheet'
import { myBindings, useCampaignStore } from '../store/campaign'
import { useLibraryStore } from '../store/library'
import { useRulesContent } from '../store/rules'
import { summarizeCharacter } from './summary'

const DEBOUNCE_MS = 600

/**
 * Keeps the party board up to date: whenever a character that is playing in a campaign changes
 * (HP, AC, exhaustion, ...), its summary is sent to that campaign. Renders nothing.
 */
export function CampaignSync() {
    const characters = useLibraryStore((state) => state.characters)
    const bindings = useCampaignStore(myBindings)
    const connect = useCampaignStore((state) => state.connect)
    const userId = useCampaignStore((state) => state.userId)
    const publishStatus = useCampaignStore((state) => state.publishStatus)
    const content = useRulesContent()
    const lastSent = useRef(new Map<string, string>())

    // Restore the sign-in when the app opens, so this tab knows who it is before anything is sent.
    useEffect(() => {
        void connect().catch(() => undefined)
    }, [connect])

    useEffect(() => {
        const timers: number[] = []
        const playing = new Set<string>()

        for (const character of characters) {
            const campaignId = bindings[character.id]
            if (!campaignId) continue

            const summary = summarizeCharacter(character, computeSheet(character, content), content)
            const fingerprint = JSON.stringify(summary)
            const key = `${userId}:${campaignId}:${character.id}`
            playing.add(key)
            if (lastSent.current.get(key) === fingerprint) continue

            timers.push(
                window.setTimeout(() => {
                    lastSent.current.set(key, fingerprint)
                    publishStatus(campaignId, summary)
                }, DEBOUNCE_MS),
            )
        }

        // Forget characters that are no longer playing here, so playing one again sends its stats again.
        for (const key of [...lastSent.current.keys()]) if (!playing.has(key)) lastSent.current.delete(key)

        return () => timers.forEach((timer) => window.clearTimeout(timer))
    }, [characters, bindings, content, publishStatus, userId])

    return null
}
