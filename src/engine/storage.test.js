import { describe, expect, it } from 'vitest'
import { createInitialState, createStorage, exportBackup, importBackup } from './storage'

const memoryBackend = () => {
  const data = new Map()
  return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }
}

describe('storage', () => {
  it('round-trips state', () => {
    const storage = createStorage(memoryBackend())
    const state = { ...createInitialState(), cards: { a: { step: 1 } } }
    expect(storage.save(state)).toBe(true)
    expect(storage.load()).toEqual(state)
  })

  it('falls back to a fresh state when nothing is saved or data is corrupt', () => {
    const backend = memoryBackend()
    expect(createStorage(backend).load()).toEqual(createInitialState())
    backend.setItem('bshell:fr:v1', '{not json')
    expect(createStorage(backend).load()).toEqual(createInitialState())
  })

  it('survives a backend that throws', () => {
    const broken = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
    const storage = createStorage(broken)
    expect(storage.load()).toEqual(createInitialState())
    expect(storage.save(createInitialState())).toBe(false)
  })

  it('fills in settings added after the save was written', () => {
    const backend = memoryBackend()
    backend.setItem('bshell:fr:v1', JSON.stringify({ version: 1, cards: {}, settings: { tenses: ['Imparfait'] } }))
    expect(createStorage(backend).load().settings).toEqual({ tenses: ['Imparfait'], dailyTarget: 3 })
  })
})

describe('backup', () => {
  it('exports and re-imports', () => {
    const state = { ...createInitialState(), cards: { a: { step: 2 } } }
    expect(importBackup(exportBackup(state))).toEqual(state)
  })

  it('rejects files that are not backups', () => {
    expect(() => importBackup('hello')).toThrow('Not a b.shell backup file')
    expect(() => importBackup('{"version":1,"cards":{}}')).toThrow('Not a b.shell backup file')
  })
})
