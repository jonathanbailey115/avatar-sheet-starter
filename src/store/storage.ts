import { create } from 'zustand'
import { createJSONStorage } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'

interface StorageStatus {
    /** Set when the browser refused a write (private mode, quota). Data will be lost on reload. */
    writeFailed: boolean
    setWriteFailed: (failed: boolean) => void
}

export const useStorageStatus = create<StorageStatus>((set) => ({
    writeFailed: false,
    setWriteFailed: (failed) => set({ writeFailed: failed }),
}))

const memory = new Map<string, string>()

function browserStorage(): Storage | null {
    try {
        return typeof localStorage === 'undefined' ? null : localStorage
    } catch {
        return null
    }
}

/** localStorage with an in-memory fallback so the app still runs when storage is unavailable. */
export const safeStateStorage: StateStorage = {
    getItem: (name) => {
        try {
            return browserStorage()?.getItem(name) ?? memory.get(name) ?? null
        } catch {
            return memory.get(name) ?? null
        }
    },
    setItem: (name, value) => {
        memory.set(name, value)
        try {
            browserStorage()?.setItem(name, value)
            if (useStorageStatus.getState().writeFailed) {
                useStorageStatus.getState().setWriteFailed(false)
            }
        } catch {
            useStorageStatus.getState().setWriteFailed(true)
        }
    },
    removeItem: (name) => {
        memory.delete(name)
        try {
            browserStorage()?.removeItem(name)
        } catch {
            // nothing else to do
        }
    },
}

export const jsonStorage = createJSONStorage(() => safeStateStorage)
