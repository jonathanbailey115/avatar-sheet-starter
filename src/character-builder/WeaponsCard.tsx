import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import { findWeapon, weaponTable } from '../data/weapons'
import { weaponProficient } from '../engine/attacks'
import { newId } from '../lib/character'
import type { Character, Lineage } from '../types/schema'

type WeaponsCardProps = {
    character: Character
    setCharacter: Dispatch<SetStateAction<Character>>
    lineage: Lineage | null
}

const GROUPS = [
    { label: 'Simple weapons', category: 'simple' },
    { label: 'Martial weapons', category: 'martial' },
] as const

export function WeaponsCard({ character, setCharacter, lineage }: WeaponsCardProps) {
    const [choice, setChoice] = useState('')

    const add = () => {
        if (!choice) return
        setCharacter((current) => ({
            ...current,
            weapons: [...current.weapons, { id: newId(), weaponId: choice, bonus: 0 }],
        }))
        setChoice('')
    }

    return (
        <SectionCard title="Weapons">
            <p className="muted">
                Weapons you add here appear as attacks on the play sheet. Damage dice come from the weapon;
                proficiency comes from your lineage.
            </p>

            <div className="actions inline-actions">
                <select value={choice} onChange={(event) => setChoice(event.target.value)} aria-label="Weapon to add">
                    <option value="">Choose a weapon</option>
                    {GROUPS.map((group) => (
                        <optgroup key={group.category} label={group.label}>
                            {weaponTable
                                .filter((weapon) => weapon.category === group.category)
                                .map((weapon) => (
                                    <option key={weapon.id} value={weapon.id}>
                                        {weapon.name} ({weapon.damage} {weapon.damageType})
                                    </option>
                                ))}
                        </optgroup>
                    ))}
                </select>
                <button className="primary-button" type="button" disabled={!choice} onClick={add}>
                    Add weapon
                </button>
            </div>

            {character.weapons.length === 0 ? (
                <p>No weapons added yet.</p>
            ) : (
                <div className="npc-list">
                    {character.weapons.map((equipped) => {
                        const weapon = findWeapon(equipped.weaponId)
                        if (!weapon) return null
                        const proficient = weaponProficient(weapon, lineage?.weaponProficiencies)

                        return (
                            <article key={equipped.id} className="npc-item">
                                <h3>{weapon.name}</h3>
                                <p>
                                    {weapon.damage} {weapon.damageType}
                                    {weapon.versatileDamage ? ` (${weapon.versatileDamage} two-handed)` : ''}
                                    {weapon.properties.length > 0 ? ` · ${weapon.properties.join(', ')}` : ''}
                                    {weapon.range ? ` · range ${weapon.range}` : ''}
                                </p>
                                <p className="muted">
                                    {proficient ? 'Proficient' : 'Not proficient'} · {weapon.source}
                                </p>

                                <div className="actions inline-actions">
                                    <label>
                                        Bonus to attack and damage
                                        <input
                                            type="number"
                                            min={-5}
                                            max={10}
                                            value={equipped.bonus}
                                            onChange={(event) =>
                                                setCharacter((current) => ({
                                                    ...current,
                                                    weapons: current.weapons.map((item) =>
                                                        item.id === equipped.id
                                                            ? {
                                                                  ...item,
                                                                  bonus: Math.max(
                                                                      -5,
                                                                      Math.min(10, Math.round(Number(event.target.value) || 0)),
                                                                  ),
                                                              }
                                                            : item,
                                                    ),
                                                }))
                                            }
                                        />
                                    </label>
                                    <button
                                        className="secondary-button"
                                        type="button"
                                        onClick={() =>
                                            setCharacter((current) => ({
                                                ...current,
                                                weapons: current.weapons.filter((item) => item.id !== equipped.id),
                                            }))
                                        }
                                    >
                                        Remove
                                    </button>
                                </div>
                            </article>
                        )
                    })}
                </div>
            )}
        </SectionCard>
    )
}
