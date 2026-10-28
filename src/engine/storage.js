import { emptyStreak } from './streak'

// The only module that touches persistence. Swap the backend (or wrap it with
// a sync layer) here when Supabase arrives in v2.
const KEY = 'bshell:fr:v1'
export const SCHEMA_VERSION = 1

export const createInitialState = () => ({
  version: SCHEMA_VERSION,
  lang: 'fr',
  cards: {},
  streak: emptyStreak(),
  daily: { day: null, rounds: 0, reviews: 0 },
  settings: { tenses: ['Présent', 'Passé Composé'], dailyTarget: 3 },
})

const withDefaults = saved => {
  const initial = createInitialState()
  return {
    ...initial,
    ...saved,
    streak: { ...initial.streak, ...saved.streak },
    daily: { ...initial.daily, ...saved.daily },
    settings: { ...initial.settings, ...saved.settings },
  }
}

const isState = value =>
  value && typeof value === 'object' && value.version === SCHEMA_VERSION && value.cards && typeof value.cards === 'object'

// Storage access can throw (private mode, blocked site data), so every call is guarded.
export function createStorage(backend = globalThis.localStorage) {
  return {
    load() {
      try {
        const saved = JSON.parse(backend?.getItem(KEY) ?? 'null')
        return isState(saved) ? withDefaults(saved) : createInitialState()
      } catch {
        return createInitialState()
      }
    },
    save(state) {
      try {
        backend.setItem(KEY, JSON.stringify(state))
        return true
      } catch {
        return false
      }
    },
  }
}

export const exportBackup = state => JSON.stringify({ app: 'b.shell', exportedAt: new Date().toISOString(), ...state })

export function importBackup(text) {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Not a b.shell backup file')
  }
  if (parsed?.app !== 'b.shell' || !isState(parsed)) throw new Error('Not a b.shell backup file')
  const { app: _app, exportedAt: _exportedAt, ...state } = parsed
  return withDefaults(state)
}
