<?php
/**
 * GET  /api/bot-config?secret=XXX        — les all konfig
 * POST /api/bot-config                   — oppdater én verdi
 *      body: { secret, key, value }
 */

header("Content-Type: application/json; charset=utf-8");
header("X-Content-Type-Options: nosniff");

$DB_PATH      = getenv("DB_PATH") ?: __DIR__ . "/../../hakim-bot/hakim.db";
$ADMIN_SECRET = getenv("ADMIN_SECRET") ?: "";

/* ── auth ──────────────────────────────────────────────────────────────── */
$secret = $_GET["secret"] ?? (json_decode(file_get_contents("php://input"), true)["secret"] ?? "");
if (!$ADMIN_SECRET || !hash_equals($ADMIN_SECRET, (string)$secret)) {
    http_response_code(403);
    echo json_encode(["ok" => false, "error" => "Forbidden"]);
    exit;
}

/* ── open db ───────────────────────────────────────────────────────────── */
try {
    $db = new PDO("sqlite:" . $DB_PATH);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["ok" => false, "error" => "DB unavailable"]);
    exit;
}

/* ── GET: return all config ─────────────────────────────────────────────── */
if ($_SERVER["REQUEST_METHOD"] === "GET") {
    $rows = $db->query("SELECT key, value, updated_at FROM bot_config ORDER BY key")->fetchAll(PDO::FETCH_ASSOC);

    /* Mask API keys — show only last 6 chars */
    foreach ($rows as &$row) {
        if (str_contains($row["key"], "_api_key") && strlen($row["value"]) > 6) {
            $row["value"] = str_repeat("•", 12) . substr($row["value"], -6);
            $row["masked"] = true;
        }
    }
    echo json_encode(["ok" => true, "config" => $rows]);
    exit;
}

/* ── POST: update one key ───────────────────────────────────────────────── */
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $body  = json_decode(file_get_contents("php://input"), true) ?: [];
    $key   = trim($body["key"] ?? "");
    $value = $body["value"] ?? "";

    if ($key === "") {
        http_response_code(400);
        echo json_encode(["ok" => false, "error" => "Missing key"]);
        exit;
    }

    /* If value is the masked placeholder, skip (don't overwrite real key) */
    if (str_contains((string)$value, "••••")) {
        echo json_encode(["ok" => true, "skipped" => true]);
        exit;
    }

    /* Log old value */
    $old = $db->prepare("SELECT value FROM bot_config WHERE key = ?")->execute([$key]);
    $old = $db->query("SELECT value FROM bot_config WHERE key = " . $db->quote($key))->fetchColumn();

    $db->prepare("INSERT INTO bot_config (key, value) VALUES (?, ?)
                  ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP")
       ->execute([$key, $value]);

    $db->prepare("INSERT INTO bot_config_log (key, old_value, new_value) VALUES (?,?,?)")
       ->execute([$key, $old, $value]);

    echo json_encode(["ok" => true]);
    exit;
}

http_response_code(405);
echo json_encode(["ok" => false, "error" => "Method not allowed"]);
