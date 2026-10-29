// Example sentences are written once per combo, using the masculine form
// ("Hier, ils sont allés au cinéma."). Other variants swap their phrase in.

const MAX_LENGTH = 120

const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// The phrase as whole words ("qu'il soit" still matches "il soit"); its first
// letter may be capitalised at the start of a sentence.
const phrasePattern = (phrase, flags = 'u') =>
  new RegExp(`(?<!\\p{L})[${phrase[0]}${phrase[0].toUpperCase()}]${escape(phrase.slice(1))}(?![\\p{L}])`, flags)

const baseForm = combo => combo.forms.m ?? Object.values(combo.forms)[0]

export function sentenceFor(sentence, combo, variant) {
  if (!sentence) return null
  const base = baseForm(combo)
  const match = sentence.match(phrasePattern(base))
  if (!match) return null
  let phrase = combo.forms[variant] ?? base
  if (match[0][0] !== base[0]) phrase = phrase[0].toUpperCase() + phrase.slice(1)
  return {
    before: sentence.slice(0, match.index),
    phrase,
    after: sentence.slice(match.index + match[0].length),
  }
}

export function sentenceProblems(sentence, combo) {
  if (typeof sentence !== 'string' || !sentence.trim()) return ['empty']
  const problems = []
  const base = baseForm(combo)
  const count = sentence.match(phrasePattern(base, 'gu'))?.length ?? 0
  if (count === 0) problems.push(`missing "${base}"`)
  if (count > 1) problems.push(`"${base}" appears ${count} times`)
  if (/[’‘]/.test(sentence)) problems.push('curly apostrophe')
  if (!/^[«A-ZÀ-ÖØ-Þ]/.test(sentence)) problems.push('should start with a capital')
  if (!/[.!?»]$/.test(sentence)) problems.push('should end with punctuation')
  if (sentence.length > MAX_LENGTH) problems.push(`longer than ${MAX_LENGTH} characters`)
  return problems
}
