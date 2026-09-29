import { useMemo } from 'react'
import type { RulesContent } from '../lib/normalize'
import { useCollection } from './content'

/** All rules content as one object, for the engine. Updates when the GM edits content. */
export function useRulesContent(): RulesContent {
    const classes = useCollection('classes')
    const subclasses = useCollection('subclasses')
    const lineages = useCollection('lineages')
    const backgrounds = useCollection('backgrounds')
    const features = useCollection('features')
    const techniques = useCollection('techniques')

    return useMemo(
        () => ({ classes, subclasses, lineages, backgrounds, features, techniques }),
        [classes, subclasses, lineages, backgrounds, features, techniques],
    )
}
