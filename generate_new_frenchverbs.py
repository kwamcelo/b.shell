import json
import os
import sys
from pathlib import Path

try:
    from mlconjug3 import Conjugator
except ImportError:
    sys.stderr.write("mlconjug3 not installed. Run: pip install mlconjug3\n")
    sys.exit(1)

ROOT = Path(__file__).parent
OLD_PATH = ROOT / "frenchverbs.json"
NEW_PATH = ROOT / "new_frenchverbs.json"

TENSE_MAP = {
    "Présent": ("indicative", "present"),
    "Passé Composé": ("indicative", "perfect"),
    "Imparfait": ("indicative", "imperfect"),
    "Futur Simple": ("indicative", "future"),
    "Conditionnel Présent": ("conditional", "present"),
    "Plus-que-parfait": ("indicative", "pluperfect"),
    "Futur Antérieur": ("indicative", "future_perfect"),
    "Conditionnel Passé": ("conditional", "perfect"),
    "Subjonctif": ("subjunctive", "present"),
    "Subjonctif Passé": ("subjunctive", "imperfect"),
    # Futur Proche handled separately
}

PRONOUNS = [
    ("1e personne du singulier", "1s"),
    ("2e personne du singulier", "2s"),
    ("3e personne du singulier", "3s"),
    ("1e personne du pluriel", "1p"),
    ("2e personne du pluriel", "2p"),
    ("3e personne du pluriel", "3p"),
]


def load_verbs():
    try:
        with OLD_PATH.open() as f:
            data = json.load(f)
        return list(data.keys())
    except FileNotFoundError:
        sys.stderr.write("frenchverbs.json not found; add verbs list manually.\n")
        return []


def build_variants(form, person_code):
    """Return value matching existing structure. Duplicate 3s/3p into gender buckets."""
    if person_code == "3s":
        return [{"m": f"il {form}", "f": f"elle {form}", "neutral": f"on {form}"}]
    if person_code == "3p":
        return [{"m": f"ils {form}", "f": f"elles {form}"}]
    return form


def conjugate_verb(conjugator, verb):
    tpl = conjugator.conjugate(verb)
    entry = {}

    # Futur Proche helper: aller (present) + infinitive
    aller_forms = tpl.conjug_info['indicative']['present'] if verb == 'aller' else Conjugator(language='fr').conjugate('aller').conjug_info['indicative']['present']

    for tense_label, (mood, tense_key) in TENSE_MAP.items():
        forms = tpl.conjug_info.get(mood, {}).get(tense_key, {})
        tense_obj = {}
        for label, code in PRONOUNS:
            form = forms.get(code)
            if not form:
                continue
            tense_obj[label] = build_variants(form, code)
        entry[tense_label] = [tense_obj]

    # Futur Proche
    fp_obj = {}
    for label, code in PRONOUNS:
        aller_form = aller_forms.get(code)
        if not aller_form:
            continue
        inf = verb
        combined = f"{aller_form} {inf}"
        fp_obj[label] = build_variants(combined, code)
    entry["Futur Proche"] = [fp_obj]

    return entry


def main():
    verbs = load_verbs()
    if not verbs:
        sys.stderr.write("No verbs to process.\n")
        return

    conj = Conjugator(language='fr')
    out = {}
    for verb in verbs:
        try:
            out[verb] = [conjugate_verb(conj, verb.lower())]
        except Exception as exc:
            sys.stderr.write(f"Failed to conjugate {verb}: {exc}\n")

    NEW_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2))
    print(f"Wrote {NEW_PATH}")


if __name__ == "__main__":
    main()
