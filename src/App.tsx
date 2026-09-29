import { useState } from 'react'
import { CampaignSync } from './campaign/CampaignSync'
import { BuilderScreen } from './screens/BuilderScreen'
import { CampaignScreen } from './screens/CampaignScreen'
import { DataScreen } from './screens/DataScreen'
import { LibraryScreen } from './screens/LibraryScreen'
import { NpcScreen } from './screens/NpcScreen'
import { PlayScreen } from './screens/PlayScreen'
import { useStorageStatus } from './store/storage'

type AppTab = 'library' | 'play' | 'campaigns' | 'builder' | 'npc' | 'data'

const TABS: Array<{ id: AppTab; label: string }> = [
    { id: 'library', label: 'My Characters' },
    { id: 'play', label: 'Play' },
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'builder', label: 'Character Builder' },
    { id: 'npc', label: 'NPC Studio' },
    { id: 'data', label: 'Campaign Data' },
]

export default function App() {
    const [activeTab, setActiveTab] = useState<AppTab>('library')
    const writeFailed = useStorageStatus((state) => state.writeFailed)

    return (
        <main className="app-shell">
            <CampaignSync />
            <header className="hero">
                <p className="eyebrow">Avatar the Legend of Ling</p>
                <h1>Avatar DND</h1>
                <p className="lede">
                    Create characters, manage NPCs, and keep your campaign data for your custom
                    Avatar campaign.
                </p>
            </header>

            {writeFailed && (
                <p className="status-message" role="alert">
                    Your browser is blocking storage, so changes will be lost when you close this
                    tab. Use "Export all (backup)" on My Characters to save your work.
                </p>
            )}

            <nav className="tab-bar" role="tablist" aria-label="App sections">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        id={`tab-${tab.id}`}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        aria-controls={`panel-${tab.id}`}
                        className={activeTab === tab.id ? 'tab-button active' : 'tab-button'}
                        onClick={() => setActiveTab(tab.id)}
                        type="button"
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            {activeTab === 'library' && (
                <LibraryScreen
                    onPlay={() => setActiveTab('play')}
                    onEdit={() => setActiveTab('builder')}
                />
            )}
            {activeTab === 'play' && (
                <PlayScreen
                    onEdit={() => setActiveTab('builder')}
                    onOpenLibrary={() => setActiveTab('library')}
                />
            )}
            {activeTab === 'campaigns' && <CampaignScreen />}
            {activeTab === 'builder' && (
                <BuilderScreen
                    onOpenLibrary={() => setActiveTab('library')}
                    onPlay={() => setActiveTab('play')}
                />
            )}
            {activeTab === 'npc' && <NpcScreen />}
            {activeTab === 'data' && <DataScreen />}
        </main>
    )
}
