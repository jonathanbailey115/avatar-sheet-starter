import type { Background, Feature, SkillName } from '../types/schema'

/**
 * Premade backgrounds. gmbinder defines none (its equipment lines only mention "your background"),
 * so these are Baseline 5e: the standard skill and tool pairings, with feature text written for
 * this app. gmbinder says everyone speaks Common, so no background grants languages.
 * Players can also build a custom background instead.
 */
const entry = (
    id: string,
    name: string,
    description: string,
    skillProficiencies: SkillName[],
    toolProficiencies: string[],
    featureName: string,
    featureText: string,
): { background: Background; feature: Feature } => {
    const featureId = `background-${id}`
    return {
        background: {
            id,
            name,
            description,
            skillProficiencies,
            toolProficiencies,
            languages: [],
            featureIds: [featureId],
        },
        feature: {
            id: featureId,
            name: featureName,
            description: featureText,
            source: 'Background',
            featureType: 'Passive',
            levelRequirement: 1,
            isActiveByDefault: true,
        },
    }
}

const entries = [
    entry('acolyte', 'Acolyte', 'You served a temple or spiritual community and learned its rites and customs.',
        ['Insight', 'Religion'], [], 'Temple Shelter',
        'Communities that share your faith will shelter you and your companions and help with modest needs, though you must live by their customs in return.'),
    entry('charlatan', 'Charlatan', 'You know how to tell people what they want to hear.',
        ['Deception', 'Sleight of Hand'], ['Disguise Kit', 'Forgery Kit'], 'False Identity',
        'You keep a second identity, complete with documents and contacts, that holds up to casual scrutiny.'),
    entry('criminal', 'Criminal', 'You have a history of breaking the law and the contacts that come with it.',
        ['Deception', 'Stealth'], ['Thieves’ Tools'], 'Underworld Contact',
        'You know a reliable go-between who passes messages and rumors to and from the underworld.'),
    entry('entertainer', 'Entertainer', 'You thrive in front of an audience.',
        ['Acrobatics', 'Performance'], ['Disguise Kit', 'Musical Instrument'], 'Crowd Favorite',
        'You can perform for lodging and meals in most settlements, and people remember you fondly.'),
    entry('folk-hero', 'Folk Hero', 'You come from humble origins but are destined for more.',
        ['Animal Handling', 'Survival'], ['Artisan’s Tools', 'Vehicles (land)'], 'Friend of the Common Folk',
        'Ordinary people will hide and feed you if you are not asking them to break the law or risk their lives.'),
    entry('guild-artisan', 'Guild Artisan', 'You belong to a guild of skilled craftspeople or merchants.',
        ['Insight', 'Persuasion'], ['Artisan’s Tools'], 'Guild Standing',
        'Your guild gives you lodging, legal backing, and access to fellow members, in return for dues.'),
    entry('hermit', 'Hermit', 'You lived apart from society for a long time.',
        ['Medicine', 'Religion'], ['Herbalism Kit'], 'Hard-Won Insight',
        'Your seclusion left you with one significant discovery. Work with your GM to decide what it is.'),
    entry('noble', 'Noble', 'You come from wealth, rank, and privilege.',
        ['History', 'Persuasion'], ['Gaming Set'], 'Privileged Standing',
        'People of wealth and rank welcome you, and local officials make time for you.'),
    entry('outlander', 'Outlander', 'You grew up far from cities, in the wild.',
        ['Athletics', 'Survival'], ['Musical Instrument'], 'Wanderer’s Memory',
        'You recall the layout of terrain and settlements, and can usually find food and fresh water for yourself and up to five others each day.'),
    entry('sage', 'Sage', 'You spent years learning the lore of the world.',
        ['Arcana', 'History'], [], 'Researcher',
        'When you do not know something, you often know where and from whom to learn it.'),
    entry('sailor', 'Sailor', 'You sailed on a seagoing vessel for years.',
        ['Athletics', 'Perception'], ['Navigator’s Tools', 'Vehicles (water)'], 'Ship’s Passage',
        'You can secure free passage on a ship for yourself and companions in exchange for work on the voyage.'),
    entry('soldier', 'Soldier', 'War has been your life for as long as you can remember.',
        ['Athletics', 'Intimidation'], ['Gaming Set', 'Vehicles (land)'], 'Old Rank',
        'Fellow soldiers and veterans recognize your rank and give you deference and access to military camps.'),
    entry('urchin', 'Urchin', 'You grew up on the streets, alone and poor.',
        ['Sleight of Hand', 'Stealth'], ['Disguise Kit', 'Thieves’ Tools'], 'City Ways',
        'You know the hidden routes through settlements and can move through them at twice the normal pace.'),
]

export const backgrounds: Background[] = entries.map((item) => item.background)
export const backgroundFeatures: Feature[] = entries.map((item) => item.feature)
