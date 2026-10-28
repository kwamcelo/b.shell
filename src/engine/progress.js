import { statusOf } from './scheduler'

// Cumulative tiers: I = top 25 verbs, II = top 50, III = top 100, IV = every verb.
export const TIER_SIZES = [25, 50, 100, Infinity]

// Per-tense progress: how many of the current tier's verbs are mastered
// (every person "learned") and how many more have been started.
export function tenseProgress(combos, cards, tense) {
  const byVerb = new Map()
  for (const combo of combos) {
    if (combo.tense !== tense) continue
    if (!byVerb.has(combo.verb)) byVerb.set(combo.verb, [])
    byVerb.get(combo.verb).push(combo)
  }
  // Map keeps insertion order, and combos are in frequency order.
  const verbs = [...byVerb.values()].map(list => {
    const statuses = list.map(c => statusOf(cards[c.id]))
    return {
      mastered: statuses.every(s => s === 'learned'),
      started: statuses.some(s => s !== 'unlearned'),
    }
  })

  const sizes = TIER_SIZES.map(size => Math.min(size, verbs.length))
  let tier = sizes.findIndex(size => verbs.slice(0, size).filter(v => v.mastered).length < size)
  const complete = tier === -1
  if (complete) tier = sizes.length - 1
  const inTier = verbs.slice(0, sizes[tier])

  return {
    tier: tier + 1,
    target: sizes[tier],
    mastered: inTier.filter(v => v.mastered).length,
    inProgress: inTier.filter(v => v.started && !v.mastered).length,
    complete,
  }
}
