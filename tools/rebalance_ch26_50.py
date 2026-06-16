#!/usr/bin/env python3
"""
Rebalance Shahnameh Season 2 — Chapter 26-50 progression.

Adds hero-ascension (level) requirements to each chapter's battle requirements
and increases farr targets so the second half of the game scales up in
difficulty instead of becoming easier.

Total incremental REAL sink across ch26-50: ~2,480,000 REAL.
  Speedrunner income (~25,000 REAL/day):      ~120 days total
  Dedicated player  (~14,500 REAL/day):       ~180 days total
  Casual player     (~7,500  REAL/day):       ~330 days total

Run once: python3 tools/rebalance_ch26_50.py
"""

import json, os, copy, sys

LORE_DIR = os.path.join(os.path.dirname(__file__), '..', 'season2', 'data', 'lore')

# ---------------------------------------------------------------------------
# Hero display names (for label / hint text)
# ---------------------------------------------------------------------------
HERO_NAMES = {
    'rostam-champion':    ('Rostam — Champion of Iran',     'رستم — قهرمانِ ایران',         'Рустам — Қаҳрамони Эрон'),
    'bahman-avenger':     ('Bahman — The Avenger',          'بهمن — انتقام‌گیر',             'Баҳмон — Интиқомгир'),
    'homay-queen':        ('Homay — The Warrior Queen',     'همای — ملکه‌ی جنگاور',          'Ҳумои Малика — Маликаи Ҷангавар'),
    'darab-foundling':    ('Darab — The Foundling Prince',  'داراب — شاهزاده‌ی سرگردان',     'Дороб — Шаҳзодаи Саргардон'),
    'dara-last':          ('Dara — Last King Before the Storm', 'دارا — آخرین شاه',          'Дорои Охирин — Охирин Шоҳ'),
    'eskandar':           ('Eskandar — The Two-Horned',     'اسکندر — ذوالقرنین',            'Искандар — Зулқарнайн'),
    'ardeshir-founder':   ('Ardeshir — Founder of Sassan',  'اردشیر — بنیان‌گذارِ ساسانیان', 'Ардашер — Бунёдгузори Сосониён'),
    'shapur-great':       ('Shapur the Great',              'شاپورِ بزرگ',                   'Шопури Бузург'),
    'bahram-gur':         ('Bahram Gur — The Lion Hunter',  'بهرامِ گور — شیرشکار',          'Баҳроми Гӯр — Шершикор'),
    'bahram-chubin':      ('Bahram Chubin — The Rebel General', 'بهرامِ چوبین — سردارِ شورشی', 'Баҳроми Чӯбин — Сардори Шӯришгар'),
    'anushirvan':         ('Anushirvan — The Just',         'انوشیروانِ عادل',               'Анӯшервони Одил'),
    'khosrow-parviz':     ('Khosrow Parviz — The Conqueror','خسرویِ پرویز — فاتح',           'Хусрави Парвез — Фотеҳ'),
    'shirin':             ('Shirin — Queen of Love',        'شیرین — ملکه‌ی عشق',            'Ширин — Маликаи Ишқ'),
    'yazdegerd-iii':      ('Yazdegerd III — The Last King', 'یزدگردِ سوم — آخرین شاه',      'Яздигирди III — Охирин Шоҳ'),
    'rustam-farrokhzad':  ('Rustam Farrokhzad — The Last Wall', 'رستمِ فرخزاد — آخرین دیوار', 'Рустами Фаррухзод — Охирин Девор'),
    'ferdowsi-complete':  ('Ferdowsi — The Poem Is Finished','فردوسی — شعر تمام شد',         'Фирдавсӣ — Шеър Тамом Шуд'),
}

def lv_req(hero_id, target):
    """Build a level requirement dict with trilingual labels."""
    name_en, name_fa, name_tg = HERO_NAMES[hero_id]
    return {
        "kind": "level",
        "hero_id": hero_id,
        "target": target,
        "label_en": f"{name_en} — Hero Card at Lv.{target}",
        "label_fa": f"{name_fa} — کارتِ قهرمان در سطح {target}",
        "label_tg": f"{name_tg} — Картаи қаҳрамон дар сатҳи {target}",
        "hint_en":  f"Open Heroes, find {name_en.split('—')[0].strip()} and upgrade to Level {target}.",
        "hint_fa":  f"بخشِ قهرمانان را باز کنید و {name_fa.split('—')[0].strip()} را به سطح {target} ارتقا دهید.",
        "hint_tg":  f"Қаҳрамононро кушоед ва {name_tg.split('—')[0].strip()}-ро ба сатҳи {target} баланд кунед.",
    }

# ---------------------------------------------------------------------------
# Per-chapter specification
# Keys:
#   farr        — new farr requirement target
#   owned       — owned_heroes target (unchanged from original in most cases)
#   add_levels  — list of (hero_id, level) tuples to add as new requirements
# ---------------------------------------------------------------------------
# Cost reference (incremental REAL per level step from heroes.js):
#   cost * current_level  (e.g., anushirvan cost=28000: lv2→lv3 = 28000*2 = 56000)
#
# Cumulative REAL budget per chapter (incremental only — player must have already
# paid previous milestones for the same hero):
#
# ch27:  rostam-champion lv2          = 18,000
# ch28:  rostam-champion lv3          = 36,000   + bahman-avenger lv2 = 5,500   → 41,500
# ch29:  homay-queen lv2              =  9,000
# ch30:  darab-foundling lv2          =  5,500
# ch31:  rostam-champion lv4          = 54,000   + dara-last lv2 = 6,000        → 60,000
# ch32:  eskandar lv2                 = 18,000
# ch33:  eskandar lv3                 = 36,000
# ch34:  eskandar lv4                 = 54,000
# ch35:  ardeshir-founder lv2         = 16,000
# ch36:  ardeshir-founder lv3         = 32,000   + shapur-great lv2 = 17,000    → 49,000
# ch37:  bahram-gur lv2               = 17,000   + eskandar lv5 = 72,000        → 89,000
# ch38:  ardeshir-founder lv4         = 48,000   + shapur-great lv3 = 34,000
#        + rostam-champion lv5        = 72,000                                  →154,000
# ch39:  bahram-gur lv3               = 34,000   + bahram-chubin lv2 = 19,000   → 53,000
# ch40:  anushirvan lv2               = 28,000   + ardeshir-founder lv5 = 64,000
#        + shapur-great lv4           = 51,000                                  →143,000
# ch41:  bahram-gur lv4               = 51,000   + bahram-chubin lv3 = 38,000   → 89,000
# ch42:  anushirvan lv3               = 56,000   + shapur-great lv5 = 68,000    →124,000
# ch43:  khosrow-parviz lv2           = 21,000   + bahram-gur lv5 = 68,000
#        + bahram-chubin lv4          = 57,000                                  →146,000
# ch44:  anushirvan lv4               = 84,000   + shirin lv2 = 27,000          →111,000
# ch45:  khosrow-parviz lv3           = 42,000   + bahram-chubin lv5 = 76,000   →118,000
# ch46:  anushirvan lv5               =112,000   + shirin lv3 = 54,000
#        + yazdegerd-iii lv2          = 29,000                                  →195,000
# ch47:  khosrow-parviz lv4           = 63,000   + rustam-farrokhzad lv2 = 32,000 → 95,000
# ch48:  anushirvan lv6               =140,000   + shirin lv4 = 81,000          →221,000
# ch49:  khosrow-parviz lv5           = 84,000   + shirin lv5 = 108,000
#        + ferdowsi-complete lv2      = 38,000                                  →230,000
# ch50:  anushirvan lv7               =168,000   + shirin lv6 = 135,000
#        + khosrow-parviz lv6         =105,000                                  →408,000
#
# GRAND TOTAL INCREMENTAL: ~2,483,000 REAL
# ---------------------------------------------------------------------------

CHANGES = {
    # ch26 — mild increase only (transition chapter)
    'rostams-end': {
        'farr': 20,
        'owned': 5,
        'add_levels': [],
    },
    # ch27 — first real gate: upgrade the hero you JUST earned
    'bahman': {
        'farr': 25,
        'owned': 6,
        'add_levels': [('rostam-champion', 2)],
    },
    # ch28
    'homay': {
        'farr': 28,
        'owned': 7,
        'add_levels': [('rostam-champion', 3), ('bahman-avenger', 2)],
    },
    # ch29
    'darab': {
        'farr': 31,
        'owned': 7,
        'add_levels': [('homay-queen', 2)],
    },
    # ch30
    'dara': {
        'farr': 34,
        'owned': 8,
        'add_levels': [('darab-foundling', 2)],
    },
    # ch31 — rostam-champion reaches lv4 (legendary preparation)
    'alexander': {
        'farr': 40,
        'owned': 8,
        'add_levels': [('rostam-champion', 4), ('dara-last', 2)],
    },
    # ch32 — Eskandar era begins: his own card must be upgraded
    'ashkanian-age': {
        'farr': 45,
        'owned': 9,
        'add_levels': [('eskandar', 2)],
    },
    # ch33
    'ardavan': {
        'farr': 50,
        'owned': 9,
        'add_levels': [('eskandar', 3)],
    },
    # ch34
    'ardeshir': {
        'farr': 55,
        'owned': 10,
        'add_levels': [('eskandar', 4)],
    },
    # ch35
    'shapur': {
        'farr': 60,
        'owned': 10,
        'add_levels': [('ardeshir-founder', 2)],
    },
    # ch36 — Sassanid golden age: two heroes required
    'bahram-gur': {
        'farr': 65,
        'owned': 11,
        'add_levels': [('ardeshir-founder', 3), ('shapur-great', 2)],
    },
    # ch37 — eskandar must reach his peak
    'yazdegerd-sinner': {
        'farr': 70,
        'owned': 11,
        'add_levels': [('bahram-gur', 2), ('eskandar', 5)],
    },
    # ch38 — heavy triple gate (the rebellion arc)
    'bahram-chubin': {
        'farr': 75,
        'owned': 13,
        'add_levels': [('ardeshir-founder', 4), ('shapur-great', 3), ('rostam-champion', 5)],
    },
    # ch39
    'anushirvan': {
        'farr': 80,
        'owned': 12,
        'add_levels': [('bahram-gur', 3), ('bahram-chubin', 2)],
    },
    # ch40 — anushirvan era: triple gate
    'nushzad': {
        'farr': 85,
        'owned': 12,
        'add_levels': [('anushirvan', 2), ('ardeshir-founder', 5), ('shapur-great', 4)],
    },
    # ch41
    'hormuz': {
        'farr': 90,
        'owned': 13,
        'add_levels': [('bahram-gur', 4), ('bahram-chubin', 3)],
    },
    # ch42 — empire peak
    'khosrow-parviz': {
        'farr': 96,
        'owned': 14,
        'add_levels': [('anushirvan', 3), ('shapur-great', 5)],
    },
    # ch43 — Shirin era begins: three-hero gate
    'shirin': {
        'farr': 100,
        'owned': 14,
        'add_levels': [('khosrow-parviz', 2), ('bahram-gur', 5), ('bahram-chubin', 4)],
    },
    # ch44
    'crumbling-crown': {
        'farr': 106,
        'owned': 15,
        'add_levels': [('anushirvan', 4), ('shirin', 2)],
    },
    # ch45
    'yazdegerd-iii': {
        'farr': 112,
        'owned': 15,
        'add_levels': [('khosrow-parviz', 3), ('bahram-chubin', 5)],
    },
    # ch46 — Arab conquest: three-hero gate including new era hero
    'arab-conquest': {
        'farr': 118,
        'owned': 16,
        'add_levels': [('anushirvan', 5), ('shirin', 3), ('yazdegerd-iii', 2)],
    },
    # ch47
    'mourning-pars': {
        'farr': 124,
        'owned': 16,
        'add_levels': [('khosrow-parviz', 4), ('rustam-farrokhzad', 2)],
    },
    # ch48 — elite wall: anushirvan lv6 (massive spend)
    'memory-over-sword': {
        'farr': 130,
        'owned': 17,
        'add_levels': [('anushirvan', 6), ('shirin', 4)],
    },
    # ch49 — penultimate chapter: two-hero pinnacle
    'ferdowsi-legacy': {
        'farr': 145,
        'owned': 20,
        'add_levels': [('khosrow-parviz', 5), ('shirin', 5)],
    },
    # ch50 — finale: anushirvan lv7 + shirin lv6 + khosrow-parviz lv6 + ferdowsi-complete lv2
    # ferdowsi-complete is earned on ch49 completion, so it can be gated here
    'ages-end': {
        'farr': 155,
        'owned': 20,
        'add_levels': [('anushirvan', 7), ('shirin', 6), ('khosrow-parviz', 6), ('ferdowsi-complete', 2)],
    },
}

def update_lore_file(slug, spec):
    path = os.path.join(LORE_DIR, f'{slug}.json')
    if not os.path.exists(path):
        print(f'  SKIP  {slug}.json — not found', file=sys.stderr)
        return

    with open(path, encoding='utf-8') as f:
        data = json.load(f)

    battle = data.get('battle')
    if not battle:
        print(f'  SKIP  {slug}.json — no battle block', file=sys.stderr)
        return

    reqs = battle.get('requirements', [])

    # 1. Update farr target
    changed_farr = False
    for r in reqs:
        if r.get('kind') == 'farr':
            old = r.get('target')
            r['target'] = spec['farr']
            r['label_en'] = f"Accumulate {spec['farr']} Farr"
            r['label_fa'] = f"گردآوریِ {spec['farr']} فرّ"
            r['label_tg'] = f"Ҷамъ кардани {spec['farr']} Фарр"
            r['hint_en'] = "Earn Farr by passing Medium (+1) and Hard (+2) quiz tiers in each chapter."
            r['hint_fa'] = "با گذراندنِ سطح‌های متوسط (+۱) و سخت (+۲) آزمون در هر فصل، فرّ کسب کنید."
            r['hint_tg'] = "Бо гузаштани санҷишҳои миёна (+1) ва душвор (+2) дар ҳар боб Фарр пайдо кунед."
            changed_farr = True
            print(f'  farr  {slug}: {old} → {spec["farr"]}')
            break

    # 2. Update owned_heroes target
    for r in reqs:
        if r.get('kind') == 'owned_heroes':
            r['target'] = spec['owned']
            break

    # 3. Remove any pre-existing level requirements (clean slate before adding new)
    reqs = [r for r in reqs if r.get('kind') != 'level']

    # 4. Add new level requirements
    for hero_id, target in spec['add_levels']:
        reqs.append(lv_req(hero_id, target))
        print(f'  +lv   {slug}: {hero_id} lv{target}')

    battle['requirements'] = reqs
    data['battle'] = battle

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    print('=== Rebalancing ch26-50 lore files ===')
    for slug, spec in CHANGES.items():
        print(f'\n[{slug}]')
        update_lore_file(slug, spec)
    print('\n=== Done ===')


if __name__ == '__main__':
    main()
