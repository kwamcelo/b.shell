import { describe, expect, it } from 'vitest'
import { sentenceFor, sentenceProblems } from './sentences'

const allerPC3p = { forms: { m: 'ils sont allés', f: 'elles sont allées' } }
const avoirPresent1s = { forms: { m: "j'ai" } }
const allerImp = { forms: { m: 'va' } }

describe('sentenceFor', () => {
  it('returns the sentence split around the phrase', () => {
    expect(sentenceFor('Hier soir, ils sont allés au cinéma.', allerPC3p, 'm'))
      .toEqual({ before: 'Hier soir, ', phrase: 'ils sont allés', after: ' au cinéma.' })
  })

  it('swaps in the variant, keeping a sentence-initial capital', () => {
    expect(sentenceFor('Ils sont allés au cinéma hier.', allerPC3p, 'f'))
      .toEqual({ before: '', phrase: 'Elles sont allées', after: ' au cinéma hier.' })
  })

  it('matches after an elided que', () => {
    expect(sentenceFor("Il faut qu'ils soient là.", { forms: { m: 'ils soient', f: 'elles soient' } }, 'f'))
      .toEqual({ before: "Il faut qu'", phrase: 'elles soient', after: ' là.' })
  })

  it('matches whole words only', () => {
    expect(sentenceFor('Il avance vite.', allerImp, 'm')).toBeNull()
    expect(sentenceFor('Va chercher le pain !', allerImp, 'm')).toMatchObject({ phrase: 'Va' })
  })

  it('returns null without a sentence', () => {
    expect(sentenceFor(undefined, avoirPresent1s, 'm')).toBeNull()
  })
})

describe('sentenceProblems', () => {
  it('accepts a good sentence', () => {
    expect(sentenceProblems("J'ai deux frères et une sœur.", avoirPresent1s)).toEqual([])
  })

  it('flags a missing or repeated phrase', () => {
    expect(sentenceProblems('Nous avons deux frères.', avoirPresent1s)).toEqual([`missing "j'ai"`])
    expect(sentenceProblems("J'ai faim et j'ai soif.", avoirPresent1s)).toEqual([`"j'ai" appears 2 times`])
  })

  it('flags style problems', () => {
    expect(sentenceProblems('j’ai faim', avoirPresent1s)).toEqual([
      `missing "j'ai"`, 'curly apostrophe', 'should start with a capital', 'should end with punctuation',
    ])
  })
})
