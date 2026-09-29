import type { TechniqueDamage } from '../../types/schema'
import type { TechniqueMechanics } from './mechanics'

/**
 * Hand-authored mechanics for Waterbending, Firebending and Airbending techniques (gmbinder).
 * Only techniques whose damage, save or attack roll is stated clearly are listed; the rest show
 * their text. "perLevel" comes from the technique's own "for each level above Practiced" wording;
 * where the text names a single level ("At Trained level, the damage increases by ...") the exact
 * dice are given per level instead so Mastered is not inflated.
 */

const affinity = { ability: 'affinity' } as const
const dmg = (base: string, type: string, onSave: TechniqueDamage['onSave'], more: Partial<TechniqueDamage> = {}): TechniqueDamage[] => [
    { base, type, onSave, ...more },
]
const exact = (
    practiced: string,
    trained: string,
    mastered: string,
    type: string,
    onSave: TechniqueDamage['onSave'],
    more: Partial<TechniqueDamage> = {},
): TechniqueDamage[] => [{ base: '', byLevel: { Practiced: practiced, Trained: trained, Mastered: mastered }, type, onSave, ...more }]

export const waterMechanics: Record<string, TechniqueMechanics> = {
    'water-breath-of-ice-vapor': { resolution: 'save', save: affinity },
    'water-quite-grip-of-ice': { resolution: 'save', save: affinity },
    'water-water-dome': { resolution: 'save', save: affinity },
    'water-watery-sphere': { resolution: 'save', save: affinity },
    'water-crushing-grip-of-the-seas': { resolution: 'save', save: affinity, damage: dmg('3d6', '', 'negates', { perLevel: '1d6' }) },
    'water-frostbite': { resolution: 'save', save: affinity, damage: dmg('3d8', 'cold', 'half', { perLevel: '1d8' }) },
    'water-ice-claws': {
        resolution: 'none',
        damage: dmg('2d8', 'piercing', 'unaffected', { label: 'Extra on the next unarmed strike', perLevel: '1d8' }),
    },
    'water-ice-gauntlet': {
        resolution: 'none',
        damage: dmg('1d8', 'bludgeoning', 'unaffected', { label: 'Extra on the next unarmed strike', perLevel: '1d8' }),
    },
    'water-icicle': {
        resolution: 'attack',
        damage: dmg('1d4', 'piercing or slashing', 'unaffected', { label: 'Each shard that hits', addModifier: true }),
        mechanicsNote: 'Two shards per use; roll one Bending Attack Roll for every 2 shards. Choose the damage type before attacking.',
    },
    'water-water-stream': {
        resolution: 'save',
        save: affinity,
        damage: dmg('4d6', 'bludgeoning', 'negates', { perLevel: '1d6' }),
        mechanicsNote: 'Streams wider than 5 ft add 2d6 per extra 5 ft (needs a large water source).',
    },
    'water-water-whip-water-rope': {
        resolution: 'save',
        save: { ability: 'dexterity' },
        damage: dmg('2d8', 'bludgeoning', 'negates', { perLevel: '1d6' }),
        mechanicsNote: 'Alternatively grapple without damage; the target breaks free with an affinity save.',
    },
    'water-iceberg-strike': { resolution: 'save', save: affinity, damage: dmg('5d8', 'piercing', 'negates', { perLevel: '1d8' }) },
    'water-ice-shards': {
        resolution: 'attack',
        damage: dmg('1d6', 'piercing', 'unaffected', { label: 'Each shard', perLevel: '1d6' }),
        mechanicsNote: 'One more shard for each level above Practiced.',
    },
    'water-octopus-form': {
        resolution: 'attack',
        damage: dmg('2d8', 'bludgeoning', 'unaffected', { label: 'Tendril attack (2 tendrils)', perLevel: '1d8' }),
    },
    'water-rings-of-water': {
        resolution: 'attack',
        damage: dmg('2d6', 'bludgeoning', 'unaffected', { label: 'Each jet', perLevel: '1d6' }),
    },
    'water-surf-the-wave': { resolution: 'save', save: affinity, damage: dmg('5d10', 'bludgeoning', 'half') },
    'water-wall-of-water': { resolution: 'save', save: affinity, damage: dmg('5d10', 'bludgeoning', 'half') },
    'water-water-cloak': {
        resolution: 'attack',
        damage: exact('3d8', '4d8', '4d8', 'bludgeoning', 'unaffected', { label: 'Each tentacle' }),
        mechanicsNote: 'The text only raises the damage at Trained; Mastered is treated the same as Trained.',
    },
    'water-water-spout': { resolution: 'save', save: affinity, damage: dmg('3d8', 'bludgeoning', 'half') },
    'water-wave': { resolution: 'save', save: affinity, damage: dmg('4d10', 'bludgeoning', 'half') },
    'water-whirlpool': { resolution: 'save', save: affinity, damage: dmg('4d6', 'bludgeoning', 'half') },
    'water-water-glove': {
        resolution: 'none',
        damage: dmg('2d6', 'healing', 'unaffected', { label: 'Hit points restored', perLevel: '1d6', addModifier: true }),
    },
    'water-sleep': { resolution: 'save', save: { ability: 'affinity', fallback: 'wisdom' } },
    'water-impair-sight': { resolution: 'save', save: { ability: 'affinity', fallback: 'constitution' } },
    'water-blood-twisting': {
        resolution: 'save',
        save: { ability: 'charisma' },
        damage: dmg('8d8', 'necrotic', 'half'),
        mechanicsNote: 'Non-waterbenders take the damage with no save. A Bloodbender who saves is not Restrained.',
    },
    'water-blood-boil': {
        resolution: 'save',
        save: { ability: 'charisma' },
        damage: dmg('10d10', 'necrotic', 'half'),
        mechanicsNote: 'Non-waterbenders roll no save (see the text). A Bloodbender who saves takes a quarter.',
    },
}

export const fireMechanics: Record<string, TechniqueMechanics> = {
    'fire-blazing-arc': { resolution: 'attack', damage: dmg('3d8', 'fire', 'unaffected', { perLevel: '1d8' }) },
    'fire-blocking-fire': {
        resolution: 'none',
        damage: exact('1d8', '1d10', '1d12', '', 'unaffected', { label: 'Damage reduced', addModifier: true }),
    },
    'fire-fireball': { resolution: 'save', save: affinity, damage: dmg('6d6', 'fire', 'half', { perLevel: '2d6' }) },
    'fire-fire-blade': { resolution: 'attack', damage: dmg('2d6', 'fire', 'unaffected', { perLevel: '1d6' }) },
    'fire-fire-stream': { resolution: 'save', save: affinity, damage: dmg('3d10', 'fire', 'half', { perLevel: '2d10' }) },
    'fire-fire-whip': { resolution: 'attack', damage: dmg('1d6', 'fire', 'unaffected', { perLevel: '1d6' }) },
    'fire-flame-charge': {
        resolution: 'save',
        save: { ability: 'dexterity' },
        damage: dmg('4d10', 'fire', 'negates', { perLevel: '1d10' }),
        mechanicsNote: 'You take half the damage yourself unless you pass a Strength save against your own Bending Save DC.',
    },
    'fire-flame-knives': {
        resolution: 'attack',
        damage: exact('1d8', '1d8', '2d8', 'fire', 'unaffected'),
    },
    'fire-heat-metal': { resolution: 'none', damage: dmg('2d8', 'fire', 'unaffected', { label: 'Each time (bonus action to repeat)' }) },
    'fire-heat-manipulation': {
        resolution: 'save',
        save: affinity,
        damage: dmg('2d6', 'fire', 'half'),
        mechanicsNote: 'Trained and Mastered let you add 2d6 / 5d6 damage instead of enlarging the smoke cloud; add it by hand.',
    },
    'fire-shield-of-fire': {
        resolution: 'save',
        save: affinity,
        damage: exact('2d6', '4d6', '4d6', 'fire', 'half'),
        mechanicsNote: 'The text only raises the damage at Trained; Mastered is treated the same as Trained.',
    },
    'fire-trip-the-light': { resolution: 'save', save: affinity, damage: dmg('4d8', 'fire', 'half', { perLevel: '2d8' }) },
    'fire-wall-of-fire': { resolution: 'save', save: affinity, damage: dmg('4d8', 'fire', 'half', { perLevel: '2d8' }) },
    'fire-breath-of-fire': { resolution: 'save', save: affinity, damage: dmg('6d10', 'fire', 'negates', { perLevel: '1d10' }) },
    'fire-fire-bomb': {
        resolution: 'save',
        save: affinity,
        damage: exact('10d10', '10d10', '15d10', 'fire', 'half'),
        mechanicsNote: 'You are in the blast and take half the damage unless you pass a Strength save against your own DC.',
    },
    'fire-fire-comet': { resolution: 'save', save: { ability: 'dexterity' }, damage: dmg('10d10', 'fire', 'half') },
    'fire-fire-missiles': { resolution: 'save', save: affinity, damage: dmg('6d8', 'fire', 'half') },
    'fire-fire-pinwheel': { resolution: 'save', save: affinity, damage: dmg('6d8', 'fire', 'half', { perLevel: '1d8' }) },
    'fire-pyre-wall': { resolution: 'save', save: affinity, damage: dmg('10d10', 'fire', 'half') },
    'fire-spiral-flare-kick': { resolution: 'save', save: affinity, damage: exact('5d10', '5d10', '8d10', 'fire', 'half') },
    'fire-twin-fireball-blast': { resolution: 'save', save: { ability: 'dexterity' }, damage: dmg('10d10', 'fire', 'negates') },
    'fire-blinding-light': { resolution: 'save', save: { ability: 'constitution' } },
    'fire-concussive-blow': { resolution: 'save', save: affinity },
    'fire-explosive-blast': { resolution: 'save', save: affinity, damage: exact('10d10', '13d10', '13d10', 'thunder', 'negates') },
}

export const airMechanics: Record<string, TechniqueMechanics> = {
    'air-air-blast': { resolution: 'save', save: affinity },
    'air-air-stream': { resolution: 'save', save: affinity, damage: exact('2d8', '4d8', '4d8', 'bludgeoning', 'half') },
    'air-air-spout': { resolution: 'save', save: affinity, damage: dmg('3d10', 'bludgeoning', 'half') },
    'air-air-swipe': { resolution: 'attack', damage: dmg('2d6', 'bludgeoning', 'unaffected', { perLevel: '2d6' }) },
    'air-air-wheel': { resolution: 'save', save: { ability: 'dexterity' }, damage: dmg('3d8', 'bludgeoning', 'half'), mechanicsNote: '+1d8 per 10 ft moved in a straight line.' },
    'air-breath-of-wind': {
        resolution: 'save',
        save: { ability: 'affinity', fallback: 'constitution' },
        damage: dmg('3d8', 'bludgeoning', 'half', { perLevel: '2d8' }),
    },
    'air-cannonball': {
        resolution: 'save',
        save: { ability: 'affinity', fallback: 'dexterity' },
        damage: exact('4d10', '4d10', '7d10', 'bludgeoning', 'half'),
    },
    'air-concussive-wake': { resolution: 'save', save: affinity, mechanicsNote: 'Damage is 1d8 plus a die per 5 ft moved; the die size grows with level (see the text).' },
    'air-gale-slice': { resolution: 'attack', damage: dmg('4d8', 'bludgeoning', 'unaffected', { perLevel: '2d8' }) },
    'air-small-funnel': { resolution: 'save', save: affinity, damage: exact('3d6', '5d6', '5d6', 'bludgeoning', 'half') },
    'air-stunning-stance': { resolution: 'save', save: { ability: 'constitution' } },
    'air-twisting-wind': {
        resolution: 'none',
        damage: dmg('1d10', 'bludgeoning', 'unaffected', { label: 'Each creature bashed', addModifier: true }),
        mechanicsNote: 'Spend movement for +1d10 per 10 ft of speed.',
    },
    'air-wind-run': {
        resolution: 'save',
        save: { ability: 'constitution' },
        damage: exact('2d8', '3d8', '5d8', 'bludgeoning', 'half', { addModifier: true }),
    },
    'air-asphyxiation': {
        resolution: 'save',
        save: affinity,
        damage: dmg('1d10', 'force', 'unaffected', { label: 'Each turn it lasts' }),
        mechanicsNote: 'Non-airbenders are affected with no save.',
    },
    'air-explosion-of-air': { resolution: 'save', save: affinity, damage: dmg('8d8', 'bludgeoning', 'half', { perLevel: '3d8' }) },
    'air-levitation': { resolution: 'save', save: { ability: 'affinity', fallback: 'constitution' } },
    'air-shockwave': {
        resolution: 'save',
        save: affinity,
        damage: dmg('6d8', 'bludgeoning', 'half', { perLevel: '2d8' }),
        mechanicsNote: 'The same dice apply again if the target hits a wall. The text is unclear whether Mastered stacks on Trained.',
    },
    'air-spoutnado': { resolution: 'save', save: affinity, damage: dmg('6d10', 'bludgeoning', 'half') },
    'air-thundering-gust': { resolution: 'save', save: { ability: 'constitution' }, damage: dmg('4d10', 'bludgeoning', 'half') },
    'air-tornado-hurricane': { resolution: 'save', save: affinity, damage: dmg('4d10', 'bludgeoning', 'unaffected', { label: 'Each turn in the eye' }) },
    'air-wind-wall': { resolution: 'save', save: affinity, damage: dmg('3d8', 'bludgeoning', 'half') },
}
