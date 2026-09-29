export type WeaponProperty =
    | 'ammunition'
    | 'finesse'
    | 'heavy'
    | 'light'
    | 'loading'
    | 'reach'
    | 'return'
    | 'thrown'
    | 'two-handed'
    | 'versatile'

export interface Weapon {
    id: string
    name: string
    category: 'simple' | 'martial'
    /** Melee weapons use Strength (Finesse: Strength or Dexterity); ranged weapons use Dexterity. */
    kind: 'melee' | 'ranged'
    damage: string
    damageType: string
    /** Damage when used with two hands (Versatile). */
    versatileDamage?: string
    properties: WeaponProperty[]
    range?: string
    /** Deals no damage (a Net restrains instead). */
    noDamage?: boolean
    /** Rules text the attack line cannot show. */
    note?: string
    /**
     * Names lineages use in their weapon proficiency lists ("Longswords", "Axes", ...),
     * matched case-insensitively ignoring plurals and spaces.
     */
    groups: string[]
    source: 'gmbinder' | 'Baseline 5e'
}

const w = (
    id: string,
    name: string,
    category: Weapon['category'],
    kind: Weapon['kind'],
    damage: string,
    damageType: string,
    properties: WeaponProperty[],
    groups: string[],
    extra: Partial<Pick<Weapon, 'versatileDamage' | 'range' | 'noDamage' | 'note'>> = {},
): Weapon => ({ id, name, category, kind, damage, damageType, properties, groups, source: 'Baseline 5e', ...extra })

/** Items gmbinder defines itself (Items section). */
const gmbinderWeapon = (weapon: Omit<Weapon, 'source'>): Weapon => ({ ...weapon, source: 'gmbinder' })

export const weaponTable: Weapon[] = [
    gmbinderWeapon({
        id: 'throwing-dart', name: 'Throwing dart', category: 'simple', kind: 'ranged', damage: '1d4', damageType: 'piercing',
        properties: ['ammunition', 'finesse', 'light', 'thrown'], range: '30/60', groups: ['Darts'],
    }),
    gmbinderWeapon({
        id: 'throwing-knives', name: 'Throwing knives', category: 'simple', kind: 'ranged', damage: '1d4', damageType: 'piercing or slashing',
        properties: ['ammunition', 'finesse', 'light', 'thrown'], range: '30/60', groups: ['Knives'],
    }),
    gmbinderWeapon({
        id: 'throwing-stars', name: 'Throwing stars', category: 'simple', kind: 'ranged', damage: '1d4', damageType: 'slashing',
        properties: ['ammunition', 'finesse', 'light', 'thrown'], range: '30/60', groups: ['Stars'],
    }),
    gmbinderWeapon({
        id: 'boomerang', name: 'Boomerang', category: 'martial', kind: 'ranged', damage: '1d6', damageType: 'bludgeoning, piercing or slashing',
        properties: ['finesse', 'return', 'thrown'], range: '30/120', groups: ['Boomerangs'],
    }),
    gmbinderWeapon({
        id: 'throwing-axe', name: 'Throwing axe', category: 'martial', kind: 'ranged', damage: '1d6', damageType: 'slashing',
        properties: ['ammunition', 'thrown'], range: '30/100', groups: ['Axes'],
    }),

    w('club', 'Club', 'simple', 'melee', '1d4', 'bludgeoning', ['light'], ['Clubs']),
    w('dagger', 'Dagger', 'simple', 'melee', '1d4', 'piercing', ['finesse', 'light', 'thrown'], ['Daggers'], { range: '20/60' }),
    w('greatclub', 'Greatclub', 'simple', 'melee', '1d8', 'bludgeoning', ['two-handed'], ['Clubs']),
    w('handaxe', 'Handaxe', 'simple', 'melee', '1d6', 'slashing', ['light', 'thrown'], ['Axes'], { range: '20/60' }),
    w('javelin', 'Javelin', 'simple', 'melee', '1d6', 'piercing', ['thrown'], ['Javelins'], { range: '30/120' }),
    w('light-hammer', 'Light hammer', 'simple', 'melee', '1d4', 'bludgeoning', ['light', 'thrown'], ['Hammers'], { range: '20/60' }),
    w('mace', 'Mace', 'simple', 'melee', '1d6', 'bludgeoning', [], ['Maces']),
    w('quarterstaff', 'Quarterstaff', 'simple', 'melee', '1d6', 'bludgeoning', ['versatile'], ['Quarterstaffs'], { versatileDamage: '1d8' }),
    w('sickle', 'Sickle', 'simple', 'melee', '1d4', 'slashing', ['light'], ['Sickles']),
    w('spear', 'Spear', 'simple', 'melee', '1d6', 'piercing', ['thrown', 'versatile'], ['Spears'], { range: '20/60', versatileDamage: '1d8' }),
    w('light-crossbow', 'Light crossbow', 'simple', 'ranged', '1d8', 'piercing', ['ammunition', 'loading', 'two-handed'], ['Crossbows', 'Light Crossbows'], { range: '80/320' }),
    w('shortbow', 'Shortbow', 'simple', 'ranged', '1d6', 'piercing', ['ammunition', 'two-handed'], ['Bows', 'Light Bows', 'Shortbows'], { range: '80/320' }),
    w('sling', 'Sling', 'simple', 'ranged', '1d4', 'bludgeoning', ['ammunition'], ['Slings'], { range: '30/120' }),

    w('battleaxe', 'Battleaxe', 'martial', 'melee', '1d8', 'slashing', ['versatile'], ['Axes'], { versatileDamage: '1d10' }),
    w('flail', 'Flail', 'martial', 'melee', '1d8', 'bludgeoning', [], ['Flails']),
    w('glaive', 'Glaive', 'martial', 'melee', '1d10', 'slashing', ['heavy', 'reach', 'two-handed'], ['Glaives']),
    w('greataxe', 'Greataxe', 'martial', 'melee', '1d12', 'slashing', ['heavy', 'two-handed'], ['Axes']),
    w('greatsword', 'Greatsword', 'martial', 'melee', '2d6', 'slashing', ['heavy', 'two-handed'], ['Greatswords']),
    w('halberd', 'Halberd', 'martial', 'melee', '1d10', 'slashing', ['heavy', 'reach', 'two-handed'], ['Halberds']),
    w('longsword', 'Longsword', 'martial', 'melee', '1d8', 'slashing', ['versatile'], ['Longswords'], { versatileDamage: '1d10' }),
    w('maul', 'Maul', 'martial', 'melee', '2d6', 'bludgeoning', ['heavy', 'two-handed'], ['Mauls']),
    w('morningstar', 'Morningstar', 'martial', 'melee', '1d8', 'piercing', [], ['Morningstars']),
    w('pike', 'Pike', 'martial', 'melee', '1d10', 'piercing', ['heavy', 'reach', 'two-handed'], ['Pikes']),
    w('rapier', 'Rapier', 'martial', 'melee', '1d8', 'piercing', ['finesse'], ['Rapiers']),
    w('scimitar', 'Scimitar', 'martial', 'melee', '1d6', 'slashing', ['finesse', 'light'], ['Scimitars']),
    w('shortsword', 'Shortsword', 'martial', 'melee', '1d6', 'piercing', ['finesse', 'light'], ['Shortswords', 'Short Swords']),
    w('trident', 'Trident', 'martial', 'melee', '1d6', 'piercing', ['thrown', 'versatile'], ['Tridents'], { range: '20/60', versatileDamage: '1d8' }),
    w('war-pick', 'War pick', 'martial', 'melee', '1d8', 'piercing', [], ['War Picks']),
    w('warhammer', 'Warhammer', 'martial', 'melee', '1d8', 'bludgeoning', ['versatile'], ['Hammers', 'Warhammers'], { versatileDamage: '1d10' }),
    w('whip', 'Whip', 'martial', 'melee', '1d4', 'slashing', ['finesse', 'reach'], ['Whips']),
    w('hand-crossbow', 'Hand crossbow', 'martial', 'ranged', '1d6', 'piercing', ['ammunition', 'light', 'loading'], ['Crossbows'], { range: '30/120' }),
    w('heavy-crossbow', 'Heavy crossbow', 'martial', 'ranged', '1d10', 'piercing', ['ammunition', 'heavy', 'loading', 'two-handed'], ['Crossbows'], { range: '100/400' }),
    // gmbinder gives Water Tribe and Air Nomads proficiency in these but no stats. Owner decision: Baseline 5e-style
    // stand-ins (only the Net is a 5e SRD weapon; Bolas and War Fan values are this app's, see RULES_QUESTIONS.md M1).
    w('net', 'Net', 'martial', 'ranged', '', 'none', ['thrown'], ['Nets'], {
        range: '5/15',
        noDamage: true,
        note: 'A Large or smaller creature hit is restrained until freed (5e Net).',
    }),
    w('bolas', 'Bolas', 'martial', 'ranged', '1d4', 'bludgeoning', ['thrown'], ['Bolas'], {
        range: '20/60',
        note: 'Stand-in stats; a Large or smaller target may be tripped or slowed at the GM’s call.',
    }),
    w('war-fan', 'War fan', 'martial', 'melee', '1d6', 'slashing', ['finesse', 'light'], ['War Fans'], {
        note: 'Stand-in stats. Airbenders can use a war fan as an extension of their airbending (+10 ft range).',
    }),
    w('longbow', 'Longbow', 'martial', 'ranged', '1d8', 'piercing', ['ammunition', 'heavy', 'two-handed'], ['Bows', 'Longbows'], { range: '150/600' }),
]

export function findWeapon(weaponId: string): Weapon | null {
    return weaponTable.find((weapon) => weapon.id === weaponId) ?? null
}
