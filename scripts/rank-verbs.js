// Ranks French verb lemmas by spoken frequency (film subtitles) from Lexique 3.83.
//
//   curl -LO http://www.lexique.org/databases/Lexique383/Lexique383.tsv
//   node scripts/rank-verbs.js path/to/Lexique383.tsv
//
// Writes scripts/verb-frequency.fr.tsv, which generate-verbs.js reads. Lexique is
// CC BY-SA 4.0 (New, Pallier et al.), so that derived file is too.
import fs from 'node:fs'
import path from 'node:path'

const KEEP = 400
const [lexiquePath] = process.argv.slice(2)
if (!lexiquePath) {
  console.error('Usage: node scripts/rank-verbs.js path/to/Lexique383.tsv')
  process.exit(1)
}

const [header, ...rows] = fs.readFileSync(lexiquePath, 'utf8').trim().split('\n')
const col = Object.fromEntries(header.split('\t').map((name, i) => [name, i]))

const frequency = new Map()
for (const line of rows) {
  const cells = line.split('\t')
  if (cells[col.cgram] !== 'VER' && cells[col.cgram] !== 'AUX') continue
  const lemma = cells[col.lemme]
  const films = Number(cells[col.freqlemfilms2]) || 0
  frequency.set(lemma, Math.max(frequency.get(lemma) ?? 0, films))
}

const ranked = [...frequency].sort((a, b) => b[1] - a[1]).slice(0, KEEP)
const out = path.join(import.meta.dirname, 'verb-frequency.fr.tsv')
fs.writeFileSync(out, ['lemma\tfreq_films_per_million', ...ranked.map(([l, f]) => `${l}\t${f.toFixed(2)}`)].join('\n') + '\n')
console.log(`Wrote ${ranked.length} verbs to ${out}`)
