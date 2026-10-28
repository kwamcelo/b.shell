import t from '../i18n/strings.fr'

// WordReference conjugates the bare verb, so drop the reflexive pronoun.
const conjugationUrl = verb =>
  `https://www.wordreference.com/conj/frverbs.aspx?v=${encodeURIComponent(verb.replace(/^se |^s'/, ''))}`

export default function WordReferenceLink({ verb, compact = false }) {
  return (
    <a className={compact ? 'wr-link compact' : 'wr-link'} href={conjugationUrl(verb)} target="_blank" rel="noreferrer"
      aria-label={`${t.wordReference} : ${verb}`}>
      {compact ? '↗' : `${t.wordReference} ↗`}
    </a>
  )
}
