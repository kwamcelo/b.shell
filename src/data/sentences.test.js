import { describe, expect, it } from 'vitest'
import verbData from './verbs.fr.json'
import { buildCombos } from '../engine/combos'
import { sentenceProblems } from '../engine/sentences'
import { expandPersons, slugOf } from './sentences'

// Run on its own with `npm run check:sentences`.
const raw = import.meta.glob('./sentences/fr/*.json', { eager: true, import: 'default' })
const files = Object.fromEntries(Object.entries(raw).map(([path, file]) => [path, { ...file, tenses: expandPersons(file.tenses) }]))
const combos = buildCombos(verbData)
const combosByVerb = Map.groupBy(combos, c => c.verb)

describe('example sentences', () => {
  const entries = Object.entries(files)

  it('are named after a known verb', () => {
    const wrong = entries
      .filter(([path, file]) => !combosByVerb.has(file.verb) || !path.endsWith(`/${slugOf(file.verb)}.json`))
      .map(([path]) => path)
    expect(wrong).toEqual([])
  })

  it('cover every combo of each verb they include, and nothing else', () => {
    const problems = []
    for (const [path, file] of entries) {
      const expected = new Set((combosByVerb.get(file.verb) ?? []).map(c => `${c.tense} | ${c.person}`))
      const actual = new Set(Object.entries(file.tenses).flatMap(([tense, persons]) => Object.keys(persons).map(p => `${tense} | ${p}`)))
      for (const key of expected) if (!actual.has(key)) problems.push(`${path}: missing ${key}`)
      for (const key of actual) if (!expected.has(key)) problems.push(`${path}: unknown ${key}`)
    }
    expect(problems).toEqual([])
  })

  it('contain the exact form, once, and read like a sentence', () => {
    const problems = []
    for (const [path, file] of entries) {
      for (const combo of combosByVerb.get(file.verb) ?? []) {
        const sentence = file.tenses[combo.tense]?.[combo.person]
        if (sentence === undefined) continue
        for (const problem of sentenceProblems(sentence, combo)) {
          problems.push(`${path} ${combo.tense} | ${combo.person}: ${problem} — ${sentence}`)
        }
      }
    }
    expect(problems).toEqual([])
  })

  it('report coverage', () => {
    const covered = entries.reduce((sum, [, file]) => sum + (combosByVerb.get(file.verb)?.length ?? 0), 0)
    console.log(`Sentences: ${entries.length} / ${combosByVerb.size} verbs, ${covered} / ${combos.length} combos`)
  })
})
