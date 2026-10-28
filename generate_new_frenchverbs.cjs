const fs = require('fs');
const path = require('path');
const basePath = __dirname;
const oldPath = path.join(basePath, 'frenchverbs.json');
const newPath = path.join(basePath, 'new_frenchverbs.json');

const conjugations = require('french-verbs-lefff/dist/conjugations.json');

const persons = [
  { label: '1e personne du singulier', pronoun: { m: 'je', f: 'je', n: 'je' }, reflexive: 'me', index: 0 },
  { label: '2e personne du singulier', pronoun: { m: 'tu', f: 'tu', n: 'tu' }, reflexive: 'te', index: 1 },
  { label: '3e personne du singulier', pronoun: { m: 'il', f: 'elle', n: 'on' }, reflexive: 'se', index: 2, gendered: true },
  { label: '1e personne du pluriel', pronoun: { m: 'nous', f: 'nous', n: 'nous' }, reflexive: 'nous', index: 3 },
  { label: '2e personne du pluriel', pronoun: { m: 'vous', f: 'vous', n: 'vous' }, reflexive: 'vous', index: 4 },
  { label: '3e personne du pluriel', pronoun: { m: 'ils', f: 'elles', n: 'ils' }, reflexive: 'se', index: 5, genderedPlural: true },
];

// order of past participles in K array: masc sing, masc plur, fem sing, fem plur
function ppFor(ppArr, gender, plural) {
  if (!Array.isArray(ppArr) || ppArr.length < 4) return null;
  if (plural) {
    return gender === 'f' ? ppArr[3] : ppArr[1];
  }
  return gender === 'f' ? ppArr[2] : ppArr[0];
}

const vowels = /^[aeiouyâêîôûäëïöüàéèùœh]/i;
function needsElision(word) {
  return vowels.test(word || '');
}

function formatPhrase(pronoun, reflexiveWord, rest) {
  let p = pronoun;
  let r = reflexiveWord;
  const w = rest;

  // Elide reflexive before vowel/mute h
  if (r && needsElision(w) && ['me', 'te', 'se'].includes(r)) {
    r = `${r[0]}'`;
  }

  // Elide je -> j' before vowel/mute h when no reflexive in between
  if (!r && p === 'je' && needsElision(w)) {
    return `j'${w}`;
  }

  return [p, r, w].filter(Boolean).join(' ');
}

// map codes to tense names we need (simple tenses)
const SIMPLE_MAP = {
  'Présent': 'P',
  'Imparfait': 'I',
  'Futur Simple': 'F',
  'Conditionnel Présent': 'C',
  'Subjonctif': 'S', // present
};

const auxMap = {
  etre: ['aller', 'venir', 'arriver', 'partir', 'revenir', 'devenir', 'entrer', 'sortir', 'monter', 'descendre', 'tomber', 'retourner', 'naître', 'mourir', 'rester'],
};

function usesEtre(verb) {
  const v = verb.toLowerCase();
  return auxMap.etre.includes(v);
}

const accentMap = {
  'ecrire': 'écrire',
  'arreter': 'arrêter',
  'creer': 'créer',
  'depenser': 'dépenser',
  'apparaitre': 'apparaître',
  'suggerer': 'suggérer',
  'elever': 'élever',
  'necessiter': 'nécessiter',
  'decider': 'décider',
  'etre': 'être',
};

function normalizeBaseVerb(v) {
  const lower = v.toLowerCase();
  return accentMap[lower] || lower;
}

function buildSimpleTense(verbForms, tenseCode, reflexive = false) {
  const forms = verbForms[tenseCode];
  if (!forms) return null;
  const out = {};
  persons.forEach(p => {
    const form = forms[p.index];
    if (!form || form === 'NA') return;
    const reflex = reflexive ? p.reflexive : null;
    if (p.gendered) {
      out[p.label] = [{
        m: formatPhrase(p.pronoun.m, reflex, form),
        f: formatPhrase(p.pronoun.f, reflex, form),
        neutral: formatPhrase(p.pronoun.n, reflex, form)
      }];
    } else if (p.genderedPlural) {
      out[p.label] = [{
        m: formatPhrase(p.pronoun.m, reflex, form),
        f: formatPhrase(p.pronoun.f, reflex, form)
      }];
    } else {
      out[p.label] = formatPhrase(p.pronoun.m, reflex, form);
    }
  });
  return out;
}

function buildCompoundTense(auxForms, ppArr, reflexive = false, agree = true) {
  if (!auxForms || !ppArr) return null;
  const out = {};
  persons.forEach(p => {
    const auxForm = auxForms[p.index];
    if (!auxForm || auxForm === 'NA') return;
    const reflex = reflexive ? p.reflexive : null;
    const ppAgreed = (pluralFlag, gender) => {
      if (!agree) return ppFor(ppArr, 'm', false);
      return ppFor(ppArr, gender, pluralFlag);
    };

    if (p.gendered) {
      out[p.label] = [{
        m: formatPhrase(p.pronoun.m, reflex, `${auxForm} ${ppAgreed(false, 'm')}`),
        f: formatPhrase(p.pronoun.f, reflex, `${auxForm} ${ppAgreed(false, 'f')}`),
        neutral: formatPhrase(p.pronoun.n, reflex, `${auxForm} ${ppAgreed(false, 'm')}`),
      }];
    } else if (p.genderedPlural) {
      out[p.label] = [{
        m: formatPhrase(p.pronoun.m, reflex, `${auxForm} ${ppAgreed(true, 'm')}`),
        f: formatPhrase(p.pronoun.f, reflex, `${auxForm} ${ppAgreed(true, 'f')}`),
      }];
    } else {
      const gender = p.label.includes('pluriel') ? 'm' : 'm';
      out[p.label] = formatPhrase(p.pronoun.m, reflex, `${auxForm} ${ppAgreed(p.label.includes('pluriel'), gender)}`);
    }
  });
  return out;
}

function buildFuturProche(presentAller, infinitive, reflexive = false) {
  const out = {};
  persons.forEach(p => {
    const auxForm = presentAller[p.index];
    if (!auxForm || auxForm === 'NA') return;
    const reflex = reflexive ? p.reflexive : null;
    if (p.gendered) {
      out[p.label] = [{
        m: formatPhrase(p.pronoun.m, reflex, `${auxForm} ${infinitive}`),
        f: formatPhrase(p.pronoun.f, reflex, `${auxForm} ${infinitive}`),
        neutral: formatPhrase(p.pronoun.n, reflex, `${auxForm} ${infinitive}`)
      }];
    } else if (p.genderedPlural) {
      out[p.label] = [{
        m: formatPhrase(p.pronoun.m, reflex, `${auxForm} ${infinitive}`),
        f: formatPhrase(p.pronoun.f, reflex, `${auxForm} ${infinitive}`)
      }];
    } else {
      out[p.label] = formatPhrase(p.pronoun.m, reflex, `${auxForm} ${infinitive}`);
    }
  });
  return out;
}

function buildVerbEntry(verb, verbForms, avoirForms, etreForms, presentAller) {
  const entry = {};
  const isReflexive = /^s(e)?[\s']/.test(verb);
  const baseVerbRaw = isReflexive ? verb.replace(/^s(e)?[\s']+/, '') : verb;
  const baseVerb = normalizeBaseVerb(baseVerbRaw);
  // simple tenses
  Object.entries(SIMPLE_MAP).forEach(([label, code]) => {
    const t = buildSimpleTense(verbForms, code, isReflexive);
    if (t) entry[label] = [t];
  });

  const ppArr = verbForms['K'];
  const auxIsEtre = usesEtre(baseVerb) || isReflexive;
  const aux = auxIsEtre ? etreForms : avoirForms;
  const agreePP = auxIsEtre || isReflexive;

  const presentAux = aux['P'];
  const imparfaitAux = aux['I'];
  const futureAux = aux['F'];
  const conditionalAux = aux['C'];
  const subjPresentAux = aux['S'];

  if (ppArr) {
    const pc = buildCompoundTense(presentAux, ppArr, isReflexive, agreePP);
    if (pc) entry['Passé Composé'] = [pc];
    const pqp = buildCompoundTense(imparfaitAux, ppArr, isReflexive, agreePP);
    if (pqp) entry['Plus-que-parfait'] = [pqp];
    const fa = buildCompoundTense(futureAux, ppArr, isReflexive, agreePP);
    if (fa) entry['Futur Antérieur'] = [fa];
    const cp = buildCompoundTense(conditionalAux, ppArr, isReflexive, agreePP);
    if (cp) entry['Conditionnel Passé'] = [cp];
    const sp = buildCompoundTense(subjPresentAux, ppArr, isReflexive, agreePP);
    if (sp) entry['Subjonctif Passé'] = [sp];
  }

  if (presentAller) entry['Futur Proche'] = [buildFuturProche(presentAller, baseVerb, isReflexive)];

  return entry;
}

function main() {
  const baseVerbs = Object.keys(JSON.parse(fs.readFileSync(oldPath, 'utf8')));
  const extraVerbsRaw = [
    'souhaiter', 'regarder', 'utiliser', 'trouver', 'donner', 'penser', 'sentir', 'raconter', 'travailler',
    'appeler', 'se sentir', 'devenir', 'essayer', 'demander', 'mettre', 'quitter', 'poser', 'garder', 'laisser',
    'courir', 'bouger', 'commencer', 'sembler', 'vivre', 'tourner', 'tenir', 'montrer', 'apporter', 'amener',
    'entendre', 'se passer', 'ecrire', 'comprendre', 'rencontrer', 'continuer', 'fournir', 'fixer', 'asseoir',
    'se lever', 'apprendre', 'perdre', 'changer', 'payer', 'conduire', 'suivre', 'depenser', 'grandir', 'arreter',
    'creer', 'ouvrir', 'marcher', 'gagner', 'offrir', 'lire', 'permettre', 'se rappeler', 'ajouter', 'se souvenir',
    'mourir', 'envoyer', 'examiner', 'construire', 'tomber', 'acheter', 'rester', 'apparaitre', 'attendre',
    'couper', 'tuer', 'suggerer', 'tirer', 'lever', 'appuyer', 'pousser', 'soulever', 'elever', 'falloir', 'compter',
    'accepter', 'vendre', 'necessiter', 'signaler', 'decider', 'manquer'
  ];
  const normalize = v => normalizeBaseVerb(v.trim());
  const all = new Set(baseVerbs.map(v => v.toLowerCase()));
  extraVerbsRaw.forEach(v => all.add(normalize(v).toLowerCase()));
  const verbs = Array.from(all).map(v => v.charAt(0).toUpperCase() + v.slice(1));
  const data = {};
  const allerForms = conjugations['aller'];
  const presentAller = allerForms ? allerForms['P'] : null;
  verbs.forEach(vCap => {
    const vLower = vCap.toLowerCase();
    const isReflexive = vLower.startsWith('se ');
    const base = isReflexive ? vLower.replace(/^s(e)?[\s']+/, '') : vLower;
    const normBase = normalizeBaseVerb(base);
    const forms = conjugations[normBase];
    if (!forms) {
      console.warn('Missing forms for', vCap);
      return;
    }
    const avoirForms = conjugations['avoir'];
    const etreForms = conjugations['etre'] || conjugations['être'];
    const entry = buildVerbEntry(vLower, forms, avoirForms, etreForms, presentAller);
    data[vCap] = [entry];
  });
  fs.writeFileSync(newPath, JSON.stringify(data, null, 2), 'utf8');
  console.log('Wrote', newPath);
}

main();
