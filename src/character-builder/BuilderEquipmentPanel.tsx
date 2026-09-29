import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import SectionCard from '../components/SectionCard'
import { SHIELD_AC_BONUS, armorTable } from '../data/armor'
import type { Character } from '../types/schema'

type BuilderEquipmentPanelProps = {
    character: Character
    setCharacter: Dispatch<SetStateAction<Character>>
}

export function BuilderEquipmentPanel({
    character,
    setCharacter,
}: BuilderEquipmentPanelProps) {
    const [newItem, setNewItem] = useState('')

    const addInventoryItem = () => {
        const trimmed = newItem.trim()

        if (!trimmed) {
            return
        }

        setCharacter((current) => ({
            ...current,
            inventoryItems: [...current.inventoryItems, trimmed],
        }))
        setNewItem('')
    }

    const updateInventoryItem = (indexToUpdate: number, value: string) => {
        setCharacter((current) => ({
            ...current,
            inventoryItems: current.inventoryItems.map((item, index) =>
                index === indexToUpdate ? value : item,
            ),
        }))
    }

    const removeInventoryItem = (indexToRemove: number) => {
        setCharacter((current) => ({
            ...current,
            inventoryItems: current.inventoryItems.filter(
                (_, index) => index !== indexToRemove,
            ),
        }))
    }

    return (
        <div className="grid">
            <SectionCard title="Loadout">
                <label>
                    Armor (used to calculate AC, Baseline 5e)
                    <select
                        value={character.armorId}
                        onChange={(event) =>
                            setCharacter((current) => ({ ...current, armorId: event.target.value }))
                        }
                    >
                        <option value="">No armor</option>
                        {(['light', 'medium', 'heavy'] as const).map((category) => (
                            <optgroup key={category} label={`${category[0].toUpperCase()}${category.slice(1)} armor`}>
                                {armorTable
                                    .filter((armor) => armor.category === category)
                                    .map((armor) => (
                                        <option key={armor.id} value={armor.id}>
                                            {armor.name} (AC {armor.baseAc}
                                            {armor.dexCap === null ? ' + Dex' : armor.dexCap > 0 ? ` + Dex, max ${armor.dexCap}` : ''})
                                        </option>
                                    ))}
                            </optgroup>
                        ))}
                    </select>
                </label>

                <label className="inline-check">
                    <input
                        type="checkbox"
                        checked={character.hasShield}
                        onChange={(event) =>
                            setCharacter((current) => ({ ...current, hasShield: event.target.checked }))
                        }
                    />
                    Carrying a shield (+{SHIELD_AC_BONUS} AC)
                </label>

                <label>
                    Other defense gear (notes)
                    <input
                        value={character.armorName}
                        onChange={(event) =>
                            setCharacter((current) => ({
                                ...current,
                                armorName: event.target.value,
                            }))
                        }
                        placeholder="Light armor, travel leathers, no armor"
                    />
                </label>

                <label>
                    Weapons and combat gear
                    <textarea
                        rows={4}
                        value={character.weaponNotes}
                        onChange={(event) =>
                            setCharacter((current) => ({
                                ...current,
                                weaponNotes: event.target.value,
                            }))
                        }
                        placeholder="Staff, dao sword, sling, rope dart, travel weapon kit"
                    />
                </label>
            </SectionCard>

            <SectionCard title="Inventory">
                <div className="actions inline-actions">
                    <input
                        value={newItem}
                        onChange={(event) => setNewItem(event.target.value)}
                        placeholder="Add an inventory item"
                    />
                    <button
                        type="button"
                        className="primary-button"
                        onClick={addInventoryItem}
                    >
                        Add item
                    </button>
                </div>

                {character.inventoryItems.length === 0 ? (
                    <p>No inventory items added yet.</p>
                ) : (
                    <div className="npc-list">
                        {character.inventoryItems.map((item, index) => (
                            <article key={`${item}-${index}`} className="npc-item">
                                <label>
                                    Item
                                    <input
                                        value={item}
                                        onChange={(event) =>
                                            updateInventoryItem(index, event.target.value)
                                        }
                                    />
                                </label>

                                <div className="actions inline-actions">
                                    <button
                                        type="button"
                                        className="secondary-button"
                                        onClick={() => removeInventoryItem(index)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </SectionCard>

            <SectionCard title="Resources">
                <label>
                    Currency or valuables
                    <input
                        value={character.currency}
                        onChange={(event) =>
                            setCharacter((current) => ({
                                ...current,
                                currency: event.target.value,
                            }))
                        }
                        placeholder="18 gp, trade goods, jade token, provisions"
                    />
                </label>

                <label>
                    Equipment notes
                    <textarea
                        rows={5}
                        value={character.equipmentNotes}
                        onChange={(event) =>
                            setCharacter((current) => ({
                                ...current,
                                equipmentNotes: event.target.value,
                            }))
                        }
                        placeholder="Special gear, heirlooms, quest items, carried supplies"
                    />
                </label>
            </SectionCard>
        </div>
    )
}