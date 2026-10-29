import { useState } from 'react'
import { CampaignSync } from './campaign/CampaignSync'
import { BuilderScreen } from './screens/BuilderScreen'
import { CampaignScreen } from './screens/CampaignScreen'
import { DataScreen } from './screens/DataScreen'
import { LibraryScreen } from './screens/LibraryScreen'
import { NpcScreen } from './screens/NpcScreen'
import { PlayScreen } from './screens/PlayScreen'
import { useStorageStatus } from './store/storage'
import { useLibraryStore } from './store/library'
import { useRulesContent } from './store/rules'
import { elementTheme } from './lib/element'

type AppTab = 'library' | 'play' | 'campaigns' | 'builder' | 'npc' | 'data'

/** `short` is the label under the icon in the phone bottom bar. `icon` is an SVG path (24×24, stroked). */
const TABS: Array<{ id: AppTab; label: string; short: string; icon: string }> = [
    { id: 'library', label: 'My Characters', short: 'Characters', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.5-4 4.5-6 8-6s6.5 2 8 6' },
    { id: 'play', label: 'Play', short: 'Play', icon: 'M12 2 21 7v10l-9 5-9-5V7zM12 2v20M3 7l9 5 9-5' },
    { id: 'campaigns', label: 'Campaigns', short: 'Campaign', icon: 'M3 20h18M5 20V9l7-5 7 5v11M10 20v-6h4v6' },
    { id: 'builder', label: 'Character Builder', short: 'Builder', icon: 'M14 4l6 6-10 10H4v-6zM12 6l6 6' },
    { id: 'npc', label: 'NPC Studio', short: 'NPCs', icon: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c1-3.5 3.3-5 6-5s5 1.5 6 5M16 5.5a3 3 0 0 1 0 5.5M18 15c1.6.6 2.6 2.2 3 5' },
    { id: 'data', label: 'Campaign Data', short: 'Data', icon: 'M4 5c0-1.1 3.6-2 8-2s8 .9 8 2-3.6 2-8 2-8-.9-8-2zM4 5v14c0 1.1 3.6 2 8 2s8-.9 8-2V5M4 12c0 1.1 3.6 2 8 2s8-.9 8-2' },
]

/** Screens that belong to the open character take its element colour. The rest stay neutral. */
const CHARACTER_TABS: AppTab[] = ['play', 'builder']

export default function App() {
    const [activeTab, setActiveTab] = useState<AppTab>('library')
    const writeFailed = useStorageStatus((state) => state.writeFailed)
    const activeClassId = useLibraryStore(
        (state) => state.characters.find((item) => item.id === state.activeId)?.classId,
    )
    const { classes } = useRulesContent()
    const element = CHARACTER_TABS.includes(activeTab)
        ? elementTheme(activeClassId === undefined ? null : { classId: activeClassId }, classes)
        : 'neutral'

    const changeTab = (tab: AppTab) => {
        setActiveTab(tab)
        window.scrollTo({ top: 0 })
    }

    return (
        <div className="app-root" data-element={element}>
            <CampaignSync />
            <header className="app-bar">
                <div className="app-bar-inner">
                    <div className="brand">
                        <svg className="brand-mark" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                            <circle cx="13" cy="13" r="11" />
                            <path d="M13 2a5.5 5.5 0 0 1 0 11 5.5 5.5 0 0 0 0 11" />
                        </svg>
                        <span className="brand-text">
                            <span className="brand-name">Avatar DND</span>
                            <span className="brand-sub">The Legend of Ling</span>
                        </span>
                    </div>

                    <nav className="tab-bar" role="tablist" aria-label="App sections">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                id={`tab-${tab.id}`}
                                role="tab"
                                aria-selected={activeTab === tab.id}
                                aria-controls={`panel-${tab.id}`}
                                className={activeTab === tab.id ? 'tab-button active' : 'tab-button'}
                                onClick={() => changeTab(tab.id)}
                                type="button"
                            >
                                <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d={tab.icon} />
                                </svg>
                                <span className="tab-label-long">{tab.label}</span>
                                <span className="tab-label-short">{tab.short}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            <main className="app-shell">
            {writeFailed && (
                <p className="status-message status-banner" role="alert">
                    Your browser is blocking storage, so changes will be lost when you close this
                    tab. Use "Export all (backup)" on My Characters to save your work.
                </p>
            )}

            {activeTab === 'library' && (
                <LibraryScreen
                    onPlay={() => changeTab('play')}
                    onEdit={() => changeTab('builder')}
                />
            )}
            {activeTab === 'play' && (
                <PlayScreen
                    onEdit={() => changeTab('builder')}
                    onOpenLibrary={() => changeTab('library')}
                />
            )}
            {activeTab === 'campaigns' && <CampaignScreen />}
            {activeTab === 'builder' && (
                <BuilderScreen
                    onOpenLibrary={() => changeTab('library')}
                    onPlay={() => changeTab('play')}
                />
            )}
            {activeTab === 'npc' && <NpcScreen />}
            {activeTab === 'data' && <DataScreen />}
            </main>
        </div>
    )
}
