<?php
/**
 * POST /api/ads/callback
 *
 * Adsgram server-side reward callback — to be registered in the Adsgram
 * dashboard under "Reward URL" for each block. Adsgram calls this endpoint
 * after a verified ad view, enabling server-side double-verification.
 *
 * Expected query params (Adsgram appends these automatically):
 *   userId    — Telegram user ID
 *   blockId   — Adsgram block ID (e.g. bot-32855)
 *
 * Until wired into the dashboard this endpoint is a no-op stub that
 * returns 200 so Adsgram doesn't retry.
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$userId  = $_GET['userId']  ?? $_POST['userId']  ?? '';
$blockId = $_GET['blockId'] ?? $_POST['blockId'] ?? '';

/* Log for auditing — write to a flat file next to this script */
$logLine = date('c') . "\t" . $blockId . "\t" . $userId . "\n";
@file_put_contents(__DIR__ . '/callback.log', $logLine, FILE_APPEND | LOCK_EX);

echo json_encode(['ok' => true, 'userId' => $userId, 'blockId' => $blockId]);
