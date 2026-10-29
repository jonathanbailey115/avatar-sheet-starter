import type { ElementTheme } from '../lib/element'

/** Stroked 24×24 glyphs for the element emblem. */
const GLYPH: Record<ElementTheme, string> = {
    water: 'M3 9c3-3 6 3 9 0s6 3 9 0M3 15c3-3 6 3 9 0s6 3 9 0',
    earth: 'M2 20 9 7l4 6 3-4 6 11z',
    fire: 'M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-4 3-6 1 2 2 3 3 3 0-3-1-6 0-9z',
    air: 'M3 9h12a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h9',
    none: 'M4 20 20 4M15 4h5v5M4 4l6 6M14 14l6 6M4 9V4h5',
    neutral: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
}

export const ELEMENT_LABEL: Record<ElementTheme, string> = {
    water: 'Water',
    earth: 'Earth',
    fire: 'Fire',
    air: 'Air',
    none: 'Non-bender',
    neutral: 'No class',
}

export function ElementEmblem({ element, size = 'lg' }: { element: ElementTheme; size?: 'sm' | 'lg' }) {
    return (
        <span className={`element-emblem element-emblem-${size}`} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d={GLYPH[element]} />
            </svg>
        </span>
    )
}
