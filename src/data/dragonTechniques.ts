import type { Technique } from '../types/schema'
import { DRAGON_TRAINER_ID } from './dragonTrainer'

/**
 * Dragon Techniques (Gamingbrew Dragon Trainer, condensed). Each costs one Training Die. They have one level
 * (no Practiced / Trained / Mastered), so the play sheet gives them a Use button instead of slot casting.
 */

const technique = (id: string, name: string, description: string, requiresLevel = 0, castingTime = 'Free (1 Training Die)'): Technique => ({
    id: `dragon-${id}`,
    name,
    element: 'Dragon',
    description,
    castingTime,
    ...(requiresLevel > 0 ? { requiresClassLevel: { classId: DRAGON_TRAINER_ID, level: requiresLevel } } : {}),
})

export const dragonTechniques: Technique[] = [
    technique('barrel-roll', 'Barrel Roll', 'Mounted on your flying dragon, when you or your dragon takes damage from an attack, spend a Training Die and have your dragon use its Reaction to reduce the damage by the roll plus your Wisdom modifier. It can then fly up to 20 feet without provoking Opportunity Attacks.', 10, 'Reaction (1 Training Die)'),
    technique('charging-rend', 'Charging Rend', 'Mounted on your dragon, when it moves at least 20 feet straight toward a creature and hits it with Rend, add the Training Die to the damage. If the target is the dragon\'s size or smaller it is also Prone.', 5),
    technique('coordinated-assault', 'Coordinated Assault', 'When your dragon hits with Rend, add the Training Die to the damage. The next attack roll by a creature other than your dragon against the target, before your next turn, has Advantage.'),
    technique('crushing-jaws', 'Crushing Jaws', 'When your dragon hits with Rend, add the Training Die to the damage. If the target is no more than one size larger than your dragon it makes a Strength save against your Dragon Technique DC or is Grappled (escape DC is the Dragon Technique DC). Only one target can be grappled this way at a time.'),
    technique('diving-assault', 'Diving Assault', 'Mounted on your flying dragon, when it descends at least 20 feet immediately before hitting with Rend, add the Training Die to the damage. It can then fly up to 20 feet without provoking Opportunity Attacks from the target.', 10),
    technique('disrupting-rend', 'Disrupting Rend', 'When your dragon hits with Rend, add the Training Die to the damage. Choose a willing creature within 10 feet of your dragon: it can use its Reaction to move up to half its Speed without provoking Opportunity Attacks from the target.'),
    technique('elemental-glob', 'Elemental Glob', 'When you command your dragon to Rend, spend a Training Die to replace that attack with a glob of elemental energy at a point within 60 feet. Creatures in a 5-foot-radius Sphere make a Dexterity save against your Dragon Technique DC and take the Training Die roll plus your Wisdom modifier (ancestry damage type), or half on a success.'),
    technique('encouraging-command', 'Encouraging Command', 'When you command your dragon within 60 feet with a Bonus Action, spend and roll a Training Die. The next time your dragon makes an attack roll before your next turn it adds the number to the roll and, if it hits, to the damage.', 10, 'Bonus Action (1 Training Die)'),
    technique('guardian-wing', 'Guardian Wing', 'When you or another creature within 5 feet of your dragon takes damage from an attack, spend a Training Die and have your dragon use its Reaction to reduce the damage by the roll plus your Wisdom modifier.', 0, 'Reaction (1 Training Die)'),
    technique('hunters-sense', 'Hunter\'s Sense', 'As a Bonus Action, spend a Training Die to give your dragon Blindsight with a range of 10 feet for 10 minutes.', 0, 'Bonus Action (1 Training Die)'),
    technique('keen-instincts', 'Keen Instincts', 'When your dragon makes a Wisdom (Perception) check, spend a Training Die and add the roll to the check. You can do this after seeing the d20 but before the outcome.'),
    technique('nurturing-bond', 'Nurturing Bond', 'As a Bonus Action, if your dragon is within 30 feet, spend Training Dice up to your proficiency bonus. Roll them, add your Wisdom modifier, and your dragon regains that many Hit Points.', 0, 'Bonus Action (Training Dice)'),
    technique('rallying-roar', 'Rallying Roar', 'As a Bonus Action, spend a Training Die to command an inspiring roar. Choose up to your proficiency bonus in creatures within 30 feet of your dragon (not the dragon): each gains temporary Hit Points equal to the roll plus your Wisdom modifier.', 5, 'Bonus Action (1 Training Die)'),
    technique('riders-guard', 'Rider\'s Guard', 'Mounted on your dragon, when an attack roll hits you, spend a Training Die and have your dragon use its Reaction to add the roll to your AC against that attack, possibly making it miss.', 5, 'Reaction (1 Training Die)'),
    technique('steadying-command', 'Steadying Command', 'When your dragon within 60 feet fails an Intelligence, Wisdom or Charisma check or save, spend a Training Die and add the roll, possibly turning the failure into a success. Once per turn.'),
    technique('sweeping-tail', 'Sweeping Tail', 'When your dragon hits with its Tail attack, spend a Training Die to have it immediately make another Tail attack against a different creature in reach. On a hit, add the Training Die to the second attack\'s damage. Once per turn.', 14),
    technique('tempest-breath', 'Tempest Breath', 'When your dragon uses Dragon Breath, spend a Training Die and roll it. The breath requires a Strength save instead of Dexterity, and on a failure a creature no more than one size larger than your dragon is pushed or pulled up to five times the roll (max 30 feet) toward or away from your dragon (your choice).', 10),
    technique('terrifying-roar', 'Terrifying Roar', 'When your dragon hits with Rend, add the Training Die to the damage. The target makes a Wisdom save against your Dragon Technique DC or is Frightened until the end of your next turn.'),
    technique('thunderous-wings', 'Thunderous Wings', 'As a Bonus Action, spend a Training Die to have your dragon unleash a wingbeat. Each creature of your choice in a 10-foot Emanation from your dragon makes a Strength save against your Dragon Technique DC, taking two Training Die rolls of Bludgeoning damage (half on a success) and being pushed 10 feet if Large or smaller on a failure.', 14, 'Bonus Action (1 Training Die)'),
    technique('wingbeat-surge', 'Wingbeat Surge', 'Mounted on your dragon, when it moves, spend and roll a Training Die. Until the end of the turn its movement does not provoke Opportunity Attacks and its Speed increases by five times the roll (max 30 feet).', 5),
    technique('wyrms-vigil', 'Wyrm\'s Vigil', 'When you roll Initiative, spend a Training Die and add the result to the roll, unless you are Incapacitated.', 0, 'On Initiative (1 Training Die)'),
]
