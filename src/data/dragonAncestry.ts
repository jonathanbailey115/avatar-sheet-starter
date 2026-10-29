import type { Element } from '../types/schema'

/**
 * Dragon Trainer (Gamingbrew, GB_DragonTrainer_Class_V2.pdf), Avatar theme (owner decisions DT1-DT5 in
 * docs/RULES_QUESTIONS.md). The PDF's colours become Far Eastern dragons by element. The names are this
 * app's stand-ins, not gmbinder's.
 */

export interface DragonAncestry {
    id: string
    name: string
    damageType: string
    /** The bending element a Dragon Mage of this ancestry draws on. */
    element: Element
    flavour: string
}

export const DRAGON_ANCESTRIES: DragonAncestry[] = [
    { id: 'ember', name: 'Ember Dragon', damageType: 'fire', element: 'Fire', flavour: 'A serpent of living flame, kin to the first Firebenders.' },
    { id: 'tide', name: 'Tide Dragon', damageType: 'cold', element: 'Water', flavour: 'A long, pale dragon that rides the frozen currents.' },
    { id: 'stone', name: 'Stone Dragon', damageType: 'acid', element: 'Earth', flavour: 'A dragon of ore and caustic mineral springs.' },
    { id: 'storm', name: 'Storm Dragon', damageType: 'lightning', element: 'Air', flavour: 'A sky dragon crowned with static and thunder.' },
    { id: 'jade', name: 'Jade Dragon', damageType: 'poison', element: 'Water', flavour: 'A green swamp dragon with a venomous breath.' },
]

export const findAncestry = (id: string): DragonAncestry | undefined => DRAGON_ANCESTRIES.find((item) => item.id === id)
