import { describe, expect, it } from 'vitest'
import verbData from './verbs.fr.json'

const verb = name => verbData.verbs.find(v => v.infinitive === name)
const JE = '1e personne du singulier'
const TU = '2e personne du singulier'
const IL = '3e personne du singulier'

// Guards against regressions in scripts/generate-verbs.js.
describe('verbs.fr.json', () => {
  it('has about 150 verbs, most frequent first', () => {
    expect(verbData.lang).toBe('fr')
    expect(verbData.verbs.length).toBeGreaterThanOrEqual(150)
    expect(verbData.verbs.slice(0, 4).map(v => v.infinitive)).toEqual(['être', 'avoir', 'aller', 'faire'])
  })

  it('includes the verbs the old list was missing', () => {
    for (const name of ['dire', 'prendre', 'partir']) expect(verb(name)).toBeDefined()
  })

  it('tags regular and irregular verbs', () => {
    expect(verb('parler').group).toBe('er')
    expect(verb('finir').group).toBe('ir')
    expect(verb('vendre').group).toBe('re')
    for (const name of ['aller', 'prendre', 'dormir', 'envoyer']) expect(verb(name).group).toBe('irregular')
  })

  it('places the reflexive before the infinitive in the Futur Proche', () => {
    expect(verb('se lever').tenses['Futur Proche'][JE]).toBe('je vais me lever')
    expect(verb("s'asseoir").tenses['Futur Proche'][JE]).toBe("je vais m'asseoir")
  })

  it('elides without stray spaces', () => {
    expect(verb('se lever').tenses['Passé Composé'][TU]).toBe("tu t'es levé")
  })

  it('uses everyday forms over literary ones', () => {
    expect(verb('pouvoir').tenses['Présent'][JE]).toBe('je peux')
    expect(verb('devoir').tenses['Impératif']).toBeUndefined()
    expect(verb("s'appeler").tenses['Impératif']).toBeUndefined()
    expect(verb('appeler').tenses['Impératif']).toBeDefined()
  })

  it('only conjugates impersonal verbs with il', () => {
    const tenses = verb('falloir').tenses
    expect(tenses['Passé Composé']).toEqual({ [IL]: 'il a fallu' })
    expect(tenses['Futur Proche']).toEqual({ [IL]: 'il va falloir' })
    expect(tenses['Impératif']).toBeUndefined()
  })

  it('has the Impératif (tu/nous/vous only) and the Passé Simple', () => {
    expect(Object.keys(verb('venir').tenses['Impératif'])).toEqual([TU, '1e personne du pluriel', '2e personne du pluriel'])
    expect(verb('se lever').tenses['Impératif'][TU]).toBe('lève-toi')
    expect(verb('aller').tenses['Passé Simple'][IL]).toEqual({ m: 'il alla', f: 'elle alla', neutral: 'on alla' })
  })
})
