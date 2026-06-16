#!/usr/bin/env python3
"""
Validation script: proves airdrop eligibility is impossible before account
age minimum (default 120 days) even under optimal "speedrunner" play.

Checks:
  1. Fastest possible chapter 50 completion (quiz gate + hero level gates)
  2. Fastest possible clan join / wallet link / offerings (immediate, day 1)
  3. Account age gate remains the binding constraint
  4. 60-day completion is mathematically impossible
"""

import sys

# ── Economy constants (from the balance design) ──────────────────────────────
DAILY_INCOME_SPEEDRUNNER = 25_000   # REAL/day (3 full energy cycles)
AIRDROP_MIN_DAYS         = 120      # configurable, currently 120
CH1_25_DAYS              = 25       # each chapter takes ~1 day for speedrunner

# Hero upgrade costs (base cost per step = cost × current_level)
HERO_COSTS = {
    'rostam-champion':   18_000,
    'ardeshir-founder':  16_000,
    'shapur-great':      17_000,
    'anushirvan':        28_000,
    'khosrow-parviz':    21_000,
    'shirin':            27_000,
    'yazdegerd-iii':     29_000,
    'ferdowsi-complete': 38_000,
}

def upgrade_cost(hero_id, from_lv, to_lv):
    cost = HERO_COSTS[hero_id]
    return sum(cost * lv for lv in range(from_lv, to_lv))

# ── Ch26-50 gate requirements in sequence ────────────────────────────────────
# Each entry: (slug, hero_id or None, from_level, to_level, days_of_content)
# Hero levels are the CUMULATIVE targets at each chapter gate.
# Speedrunner: 2 chapters/day → each pair of chapters costs 0.5 days of content.
# But some chapters have heavy level gates that require extra grind.

CH26_50_PLAN = [
    # (slug,                hero upgrade tuples (hero_id, from_lv, to_lv), chapters_per_day)
    ('rostam-heroics',      [],                                          2),  # ch26 — no extra gate
    ('bahman-avenger',      [],                                          2),  # ch27
    ('homay-queen',         [],                                          2),  # ch28
    ('darab-foundling',     [],                                          2),  # ch29
    ('dara',                [],                                          2),  # ch30
    ('alexander',           [('rostam-champion', 1, 3)],                 2),  # ch31 gate: rostam lv3
    ('ashkanian-age',       [],                                          2),  # ch32
    ('arsacid-age',         [],                                          2),  # ch33
    ('ardeshir-i',          [('ardeshir-founder', 1, 2)],                2),  # ch34 gate: ardeshir lv2
    ('shapur-i',            [('ardeshir-founder', 2, 3), ('shapur-great', 1, 2)], 2),  # ch35
    ('bahram-gur',          [('shapur-great', 2, 3)],                    2),  # ch36
    ('khosrow-i-prep',      [],                                          2),  # ch37 (no gate)
    ('bahram-chubin',       [('ardeshir-founder', 3, 4), ('shapur-great', 3, 4), ('rostam-champion', 3, 5)], 1),  # ch38
    ('anushirvan',          [('anushirvan', 1, 3)],                      1),  # ch39
    ('hormuz',              [('anushirvan', 3, 4)],                      1),  # ch40
    ('khosrow-ii-rise',     [('anushirvan', 4, 5)],                      1),  # ch41
    ('khosrow-parviz',      [('anushirvan', 5, 6), ('shapur-great', 4, 5)], 1),  # ch42
    ('shirin',              [('shirin', 1, 3)],                          1),  # ch43
    ('crumbling-crown',     [('shirin', 3, 4), ('khosrow-parviz', 1, 3)], 1),  # ch44
    ('yazdegerd-iii',       [('khosrow-parviz', 3, 4)],                  1),  # ch45
    ('arab-conquest',       [('anushirvan', 6, 7), ('shirin', 4, 5), ('yazdegerd-iii', 1, 2)], 1),  # ch46
    ('mourning-pars',       [],                                          1),  # ch47
    ('memory-over-sword',   [('anushirvan', 7, 8), ('shirin', 5, 6)],   1),  # ch48  (anushirvan maxes here)
    ('ferdowsi-legacy',     [('khosrow-parviz', 4, 5)],                  1),  # ch49
    ('ages-end',            [('anushirvan', 8, 9), ('shirin', 6, 7), ('khosrow-parviz', 5, 7), ('ferdowsi-complete', 1, 3)], 1),  # ch50
]

# Corrections: the actual plan from rebalance_ch26_50.py uses these targets:
# ch38: ardeshir lv4, shapur lv3, rostam lv5
# ch42: anushirvan lv3, shapur lv5
# ch46: anushirvan lv5, shirin lv3, yazdegerd lv2
# ch48: anushirvan lv6, shirin lv4
# ch50: anushirvan lv7, shirin lv6, khosrow lv6, ferdowsi-complete lv2
# Let's use the exact targets from the lore files:

CH26_50_EXACT = [
    # (slug, upgrades, ch_per_day)
    ('rostam-heroics',      [],                                              2),
    ('bahman-avenger',      [],                                              2),
    ('homay-queen',         [],                                              2),
    ('darab-foundling',     [],                                              2),
    ('dara',                [],                                              2),
    # ch31: rostam-champion lv3
    ('alexander',           [('rostam-champion', 1, 3)],                     2),
    ('ashkanian-age',       [],                                              2),
    ('arsacid-age',         [],                                              2),
    # ch34: ardeshir-founder lv2
    ('ardeshir-i',          [('ardeshir-founder', 1, 2)],                    2),
    # ch35: ardeshir lv3, shapur-great lv2
    ('shapur-i',            [('ardeshir-founder', 2, 3), ('shapur-great', 1, 2)], 2),
    # ch36: shapur-great lv3
    ('bahram-gur',          [('shapur-great', 2, 3)],                        2),
    ('khosrow-i-prep',      [],                                              2),
    # ch38: ardeshir lv4, shapur lv3, rostam lv5  (heavy wall — treat as 1 ch/day)
    ('bahram-chubin',       [('ardeshir-founder', 3, 4), ('shapur-great', 3, 4), ('rostam-champion', 3, 5)], 1),
    # ch39: anushirvan lv3
    ('anushirvan',          [('anushirvan', 1, 3)],                          1),
    # ch40: anushirvan lv4
    ('hormuz',              [('anushirvan', 3, 4)],                          1),
    # ch41: anushirvan lv4 (no change — already met from ch40)
    ('khosrow-ii-rise',     [],                                              1),
    # ch42: anushirvan lv3 (already met), shapur lv5
    ('khosrow-parviz',      [('shapur-great', 4, 5)],                        1),
    # ch43: shirin lv3
    ('shirin',              [('shirin', 1, 3)],                              1),
    # ch44: no new hero gate
    ('crumbling-crown',     [],                                              1),
    # ch45: no new hero gate
    ('yazdegerd-iii',       [],                                              1),
    # ch46: anushirvan lv5, shirin lv3 (met), yazdegerd-iii lv2
    ('arab-conquest',       [('anushirvan', 4, 5), ('yazdegerd-iii', 1, 2)], 1),
    # ch47: no new hero gate
    ('mourning-pars',       [],                                              1),
    # ch48: anushirvan lv6, shirin lv4
    ('memory-over-sword',   [('anushirvan', 5, 6), ('shirin', 3, 4)],        1),
    # ch49: khosrow-parviz lv3
    ('ferdowsi-legacy',     [('khosrow-parviz', 1, 3)],                      1),
    # ch50: anushirvan lv7, shirin lv6, khosrow-parviz lv6, ferdowsi-complete lv2
    ('ages-end',            [('anushirvan', 6, 7), ('shirin', 4, 6), ('khosrow-parviz', 3, 6), ('ferdowsi-complete', 1, 2)], 1),
]


def simulate_speedrunner():
    """
    Simulate a speedrunner's journey through ch26-50.
    Returns (total_days_to_ch50, breakdown).
    """
    day         = CH1_25_DAYS   # arrives at ch26 with 25 days elapsed
    real        = day * DAILY_INCOME_SPEEDRUNNER  # accumulated REAL (25 × 25,000 = 625,000)
    # Quiz rewards approximate: ch1-25 yields ~1800 REAL each in quiz rewards
    real       += 25 * 1_800
    hero_levels = {}

    print(f'  Day {day:>3}: Ch1-25 complete | REAL banked: {real:,}')

    for slug, upgrades, ch_per_day in CH26_50_EXACT:
        content_days = 1 / ch_per_day
        real_earned_during = content_days * DAILY_INCOME_SPEEDRUNNER + 1_800  # quiz

        # Calculate upgrade cost
        grind_cost = 0
        for hero_id, from_lv, to_lv in upgrades:
            cur = hero_levels.get(hero_id, 1)
            actual_from = max(cur, from_lv)
            if actual_from < to_lv:
                grind_cost += upgrade_cost(hero_id, actual_from, to_lv)
                hero_levels[hero_id] = to_lv

        # Earn content income first, then cover shortfall from time
        real += real_earned_during
        shortfall = max(0, grind_cost - real)
        grind_days = shortfall / DAILY_INCOME_SPEEDRUNNER if shortfall > 0 else 0
        real = max(0, real - grind_cost)
        day += content_days + grind_days

        if upgrades:
            print(f'  Day {day:>6.1f}: {slug:<22} | upgrades: {upgrades} | grind: {grind_days:.1f}d | REAL left: {real:,.0f}')
        else:
            print(f'  Day {day:>6.1f}: {slug:<22} |')

    return day


def main():
    print('=' * 70)
    print('AIRDROP ELIGIBILITY VALIDATION')
    print(f'Account age minimum: {AIRDROP_MIN_DAYS} days')
    print('=' * 70)

    print('\n--- Speedrunner path (25,000 REAL/day, max engagement) ---')
    ch50_day = simulate_speedrunner()

    print(f'\n  Chapter 50 completion: Day {ch50_day:.1f}')
    print(f'  Account age minimum:  Day {AIRDROP_MIN_DAYS}')

    other_gates_met_day = max(
        ch50_day,   # ch50 done (binding for speedrunner)
        1,          # clan: joinable day 1
        1,          # wallet: linkable day 1
        1,          # offerings: 3 offerings in ~1 week
    )

    print(f'\n  All non-age gates met by:   Day {other_gates_met_day:.1f}')
    print(f'  Account age gate satisfied: Day {AIRDROP_MIN_DAYS}')
    earliest_eligible = max(other_gates_met_day, AIRDROP_MIN_DAYS)
    print(f'  Earliest possible airdrop:  Day {earliest_eligible:.1f}')

    print('\n--- 60-day impossibility check ---')
    ch50_before_60 = ch50_day <= 60
    airdrop_before_60 = earliest_eligible <= 60

    print(f'  Can speedrunner finish ch50 in ≤60 days? {"YES ✗ FAIL" if ch50_before_60 else "NO ✓ PASS"}')
    print(f'  Can speedrunner claim airdrop in ≤60 days? {"YES ✗ FAIL" if airdrop_before_60 else "NO ✓ PASS"}')

    print('\n--- 120-day floor check ---')
    age_gate_is_binding = AIRDROP_MIN_DAYS >= ch50_day
    print(f'  Account age gate ({AIRDROP_MIN_DAYS}d) ≥ ch50 completion ({ch50_day:.1f}d)? '
          f'{"YES — age gate is binding ✓" if age_gate_is_binding else "NO — ch50 gate is binding (warning: age gate may not be the floor)"}')

    print('\n--- Timing summary for all player types ---')
    for label, daily, ch_rate in [
        ('Speedrunner     (~25,000 REAL/day)',  25_000, None),
        ('Dedicated daily (~14,500 REAL/day)',  14_500, None),
        ('Casual player   (~7,500 REAL/day)',    7_500, None),
    ]:
        # Rough estimate: more REAL/day → less grind; scale ch50 day proportionally
        grind_scale = DAILY_INCOME_SPEEDRUNNER / daily
        est_ch50 = 25 + (ch50_day - 25) * grind_scale
        est_eligible = max(est_ch50, AIRDROP_MIN_DAYS)
        print(f'  {label}: ch50 ~Day {est_ch50:.0f}, eligible ~Day {est_eligible:.0f}')

    print()
    if not airdrop_before_60:
        print('✓ PASS: Airdrop is provably impossible before Day 60.')
    else:
        print('✗ FAIL: A path to airdrop before Day 60 exists — tighten gates.')

    if age_gate_is_binding:
        print(f'✓ PASS: Account age gate (Day {AIRDROP_MIN_DAYS}) is the binding constraint.')
    else:
        print(f'⚠ WARNING: Ch50 completion takes longer than account age minimum — '
              f'consider raising AIRDROP_MIN_DAYS or tightening hero gates.')

    return 0 if (not airdrop_before_60 and age_gate_is_binding) else 1


if __name__ == '__main__':
    sys.exit(main())
