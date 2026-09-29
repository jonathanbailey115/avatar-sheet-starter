import { useCallback } from 'react'
import type { SetStateAction } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
    backgrounds,
    characterClasses,
    characterSubclasses,
    features,
    lineages,
    npcTemplates,
    techniques,
} from '../data'
import { applyEdits, diffEdits, emptyEdits } from '../lib/contentEdits'
import type { Edits } from '../lib/contentEdits'
import type { RulesContent } from '../lib/normalize'
import type {
    Background,
    CharacterClass,
    CharacterSubclass,
    Feature,
    Lineage,
    NpcTemplate,
    Technique,
} from '../types/schema'
import { jsonStorage } from './storage'

export interface ContentTypes {
    lineages: Lineage
    techniques: Technique
    features: Feature
    backgrounds: Background
    classes: CharacterClass
    subclasses: CharacterSubclass
    npcTemplates: NpcTemplate
}

export type ContentKind = keyof ContentTypes

type Collections = {
    [K in ContentKind]: { seed: ContentTypes[K][]; keyOf: (item: ContentTypes[K]) => string }
}

const byId = (item: { id: string }) => item.id

const COLLECTIONS: Collections = {
    lineages: { seed: lineages, keyOf: byId },
    techniques: { seed: techniques, keyOf: byId },
    features: { seed: features, keyOf: byId },
    backgrounds: { seed: backgrounds, keyOf: byId },
    classes: { seed: characterClasses, keyOf: byId },
    subclasses: { seed: characterSubclasses, keyOf: byId },
    npcTemplates: { seed: npcTemplates, keyOf: (item) => item.role },
}

const KINDS = Object.keys(COLLECTIONS) as ContentKind[]

type AllEdits = { [K in ContentKind]: Edits<ContentTypes[K]> }

function emptyAllEdits(): AllEdits {
    return Object.fromEntries(KINDS.map((kind) => [kind, emptyEdits()])) as unknown as AllEdits
}

interface ContentState {
    edits: AllEdits
    setCollection: <K extends ContentKind>(kind: K, next: ContentTypes[K][]) => void
}

export const useContentStore = create<ContentState>()(
    persist(
        (set, get) => ({
            edits: emptyAllEdits(),
            setCollection: (kind, next) => {
                const { seed, keyOf } = COLLECTIONS[kind]
                const diff = diffEdits(seed, next, keyOf)
                set({ edits: { ...get().edits, [kind]: diff } })
            },
        }),
        {
            name: 'avatar-dnd:content',
            version: 1,
            storage: jsonStorage,
            partialize: (state) => ({ edits: state.edits }),
            merge: (persisted, current) => {
                const saved = (persisted as { edits?: Partial<AllEdits> } | undefined)?.edits ?? {}
                return { ...current, edits: { ...emptyAllEdits(), ...saved } }
            },
        },
    ),
)

const resolved = new WeakMap<object, unknown[]>()

export function resolveCollection<K extends ContentKind>(
    kind: K,
    edits: Edits<ContentTypes[K]>,
): ContentTypes[K][] {
    const cached = resolved.get(edits)
    if (cached) return cached as ContentTypes[K][]

    const { seed, keyOf } = COLLECTIONS[kind]
    const value = applyEdits(seed, edits, keyOf)
    resolved.set(edits, value)
    return value
}

export function getCollection<K extends ContentKind>(kind: K): ContentTypes[K][] {
    return resolveCollection(kind, useContentStore.getState().edits[kind])
}

export function getContent(): RulesContent {
    return {
        classes: getCollection('classes'),
        subclasses: getCollection('subclasses'),
        lineages: getCollection('lineages'),
        backgrounds: getCollection('backgrounds'),
        features: getCollection('features'),
        techniques: getCollection('techniques'),
    }
}

/** Subscribe a component to one content collection. */
export function useCollection<K extends ContentKind>(kind: K): ContentTypes[K][] {
    return useContentStore((state) => resolveCollection(kind, state.edits[kind]))
}

/** Like useState for a content collection, so existing editor panels work unchanged. */
export function useCollectionState<K extends ContentKind>(
    kind: K,
): [ContentTypes[K][], (value: SetStateAction<ContentTypes[K][]>) => void] {
    const items = useCollection(kind)
    const setCollection = useContentStore((state) => state.setCollection)

    const setItems = useCallback(
        (value: SetStateAction<ContentTypes[K][]>) => {
            const current = getCollection(kind)
            const next =
                typeof value === 'function'
                    ? (value as (previous: ContentTypes[K][]) => ContentTypes[K][])(current)
                    : value
            setCollection(kind, next)
        },
        [kind, setCollection],
    )

    return [items, setItems]
}
