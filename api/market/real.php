<?php
/**
 * GET /api/market/real
 *
 * Pre-listing REAL token market simulation.
 * Returns time-varying price, change, liquidity, and sparkline points so the
 * Market section feels alive while REAL is in its Season 2 growth phase.
 *
 * Wire to a real DEX aggregator (STON.fi / DeDust / TonAPI) when REAL lists.
 * The data shape matches what market.js expects:
 *   { priceUsd, change24hPct, liquidityUsd, points: [[ts, price], ...] }
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');

$t = time();

/* Base price anchored to the season economy. Slow sinusoidal drift to simulate
   organic price discovery — the curve is deterministic per hour so two users
   always see the same data. */
$base      = 0.00042;
$drift     = sin($t / 3600) * 0.000065 + cos($t / 7200) * 0.000028;
$price     = round($base + $drift, 8);

/* 24 h change: compare current vs same point 24 h ago */
$priceYday = round($base + sin(($t - 86400) / 3600) * 0.000065 + cos(($t - 86400) / 7200) * 0.000028, 8);
$change    = ($priceYday > 0) ? round(($price - $priceYday) / $priceYday * 100, 2) : 0.0;

/* Liquidity: base pool + small intraday variation */
$liquidity = 18500 + (int)(sin($t / 1800) * 3200);

/* Sparkline: 24 hourly points covering the last 24 hours */
$points = [];
for ($i = 23; $i >= 0; $i--) {
    $ts = $t - $i * 3600;
    $y  = $base + sin($ts / 3600) * 0.000065 + cos($ts / 7200) * 0.000028;
    $points[] = [$ts, round($y, 8)];
}

echo json_encode([
    'priceUsd'     => $price,
    'change24hPct' => $change,
    'liquidityUsd' => $liquidity,
    'points'       => $points,
], JSON_UNESCAPED_UNICODE);
