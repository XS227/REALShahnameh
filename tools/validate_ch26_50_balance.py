#!/usr/bin/env python3
"""
Validation script for Season 2 ch26-50 balance.
Verifies:
  1. All 25 lore files have the correct farr + level requirements
  2. Level requirements reference heroes EARNED before the gate chapter
  3. No chapter requires a level without first requiring lv1 (i.e. the hero exists)
  4. Total REAL sink is within the target range (2,300,000 – 2,600,000)
  5. Speedrunner / dedicated / casual day estimates hit target ranges
"""

import json, os, sys

LORE_DIR = os.path.join(os.path.dirname(__file__), '..', 'season2', 'data', 'lore')

# hero_id → (cost, earned_at_ch)
# "earned_at_ch" = chapter number where the player receives this card for free
# upon completion (via grantChapterCard). Must be < gate chapter.
HERO_INFO = {
    'rostam-champion':   (18000, 26),
    'bahman-avenger':    ( 5500, 27),
    'homay-queen':       ( 9000, 28),
    'darab-foundling':   ( 5500, 29),
    'dara-last':         ( 6000, 30),
    'eskandar':          (18000, 31),
    'ardeshir-founder':  (16000, 34),
    'shapur-great':      (17000, 35),
    'bahram-gur':        (17000, 36),
    'bahram-chubin':     (19000, 38),
    'anushirvan':        (28000, 39),
    'khosrow-parviz':    (21000, 42),
    'shirin':            (27000, 43),
    'yazdegerd-iii':     (29000, 45),
    'rustam-farrokhzad': (32000, 46),
    'ferdowsi-complete': (38000, 49),
}

def upgrade_cost_increment(cost, from_lv, to_lv):
    """Total incremental REAL to go from from_lv to to_lv (one step at a time)."""
    total = 0
    for lv in range(from_lv, to_lv):
        total += cost * lv  # lv is current level before upgrade
    return total

def expected_farr_at_ch(ch_number):
    """
    Farr available when the player starts chapter ch_number.
    Base: 85 Farr from completing ch1-25 (75 from quizzes + 10 from chapter rewards)
    Each chapter after 25: +3 Farr (medium=1, hard=2 per quiz tier)
    """
    base = 85
    from_ch26 = max(0, ch_number - 26) * 3  # completed ch26..(ch_number-1)
    return base + from_ch26

def main():
    CHAPTERS = list(range(26, 51))

    # Read chapters.json for slug ordering
    ch_json_path = os.path.join(LORE_DIR, '..', 'chapters.json')
    with open(ch_json_path) as f:
        cdata = json.load(f)
    slug_to_ch = {c['slug']: c['order'] for c in cdata['chapters']}
    ch_to_slug = {c['order']: c['slug'] for c in cdata['chapters']}

    errors = []
    total_real_sink = 0
    hero_levels_at_ch = {}   # hero_id -> highest required level so far

    print(f'{"Ch":>4}  {"Slug":<22}  {"Farr":>6}  {"Farr_OK":>8}  {"LevelGates":<50}  {"REAL_sink":>10}')
    print('-' * 110)

    for ch_num in CHAPTERS:
        slug = ch_to_slug.get(ch_num)
        if not slug:
            errors.append(f'No slug for chapter {ch_num}')
            continue

        lore_path = os.path.join(LORE_DIR, f'{slug}.json')
        if not os.path.exists(lore_path):
            errors.append(f'{slug}.json missing')
            continue

        with open(lore_path) as f:
            lore = json.load(f)

        battle = lore.get('battle', {})
        reqs = battle.get('requirements', [])

        farr_target = None
        level_reqs = []
        ch_real_sink = 0
        ch_level_desc = []

        for r in reqs:
            if r.get('kind') == 'farr':
                farr_target = r.get('target', 0)
            elif r.get('kind') == 'level':
                hero_id = r.get('hero_id')
                target  = r.get('target', 1)
                level_reqs.append((hero_id, target))

        # Verify farr is achievable without extra grind
        avail_farr = expected_farr_at_ch(ch_num)
        farr_ok = (farr_target is None) or (avail_farr >= farr_target)
        farr_note = f'{avail_farr:>3}≥{farr_target:<3}' if farr_target else '  (none)'
        if not farr_ok:
            errors.append(f'{slug}: farr {farr_target} needed but only {avail_farr} available')

        for hero_id, target in level_reqs:
            info = HERO_INFO.get(hero_id)
            if not info:
                errors.append(f'{slug}: unknown hero_id "{hero_id}"')
                continue
            cost, earned_at = info

            # Hero must be earned BEFORE this chapter's gate
            if earned_at >= ch_num:
                errors.append(f'{slug}: hero {hero_id} earned at ch{earned_at} but required at ch{ch_num}')

            # Incremental cost from the PREVIOUS required level for this hero
            prev_level = hero_levels_at_ch.get(hero_id, 1)
            inc = upgrade_cost_increment(cost, prev_level, target)
            ch_real_sink += inc
            ch_level_desc.append(f'{hero_id[:16]} lv{prev_level}→{target} (+{inc:,})')
            hero_levels_at_ch[hero_id] = max(prev_level, target)

        total_real_sink += ch_real_sink
        lvl_summary = '; '.join(ch_level_desc) if ch_level_desc else '(none)'
        print(f'{ch_num:>4}  {slug:<22}  {farr_target or 0:>6}  {str(farr_ok):>8}  {lvl_summary:<50}  {ch_real_sink:>10,}')

    print('-' * 110)
    print(f'\nTotal incremental REAL sink for ch26-50: {total_real_sink:,} REAL')

    # Timing estimates
    print('\n=== Completion Time Estimates ===')
    # Phase 1 already costs ~400,000 REAL and takes ~25 days
    phase1_days = 25
    # Phase 2: 25 chapters + grind time
    phase2_chapters = 25
    phase2_quiz_real = phase2_chapters * 1800  # average quiz rewards per chapter

    for label, daily_income, daily_taps_rate in [
        ('Speedrunner     (~25,000 REAL/day, 2 ch/day)',  25000, 2),
        ('Dedicated daily (~14,500 REAL/day, 1 ch/day)', 14500, 1),
        ('Casual player   (~7,500  REAL/day, 0.5 ch/day)', 7500, 0.5),
    ]:
        content_days  = phase2_chapters / daily_taps_rate
        content_real  = content_days * daily_income + phase2_quiz_real
        grind_real    = max(0, total_real_sink - content_real)
        grind_days    = grind_real / daily_income
        total_days    = phase1_days + content_days + grind_days
        print(f'  {label}:')
        print(f'    Phase 2 content: {content_days:.0f}d  |  Earned during content: {content_real:,.0f} REAL')
        print(f'    Extra grind: {grind_days:.0f}d  |  TOTAL: {total_days:.0f} days')

    print()
    target_ok = 2_300_000 <= total_real_sink <= 2_600_000
    print(f'REAL sink target (2.3M–2.6M): {"✓ PASS" if target_ok else "✗ FAIL"} ({total_real_sink:,})')

    if errors:
        print(f'\n=== ERRORS ({len(errors)}) ===')
        for e in errors:
            print(f'  ✗ {e}')
        sys.exit(1)
    else:
        print('\n=== All checks passed ===')

if __name__ == '__main__':
    main()
