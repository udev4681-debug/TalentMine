<?php
/**
 * TalentMine Backend Configuration & Helpers
 */

$isCli = (php_sapi_name() === 'cli');

// Enable CORS for API requests if running in web context
if (!$isCli && !headers_sent()) {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
}

// Handle preflight requests
if (!$isCli && isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Return JSON response helper
function jsonResponse($data, int $statusCode = 200): void {
    global $isCli;
    if (!$isCli && !headers_sent()) {
        http_response_code($statusCode);
        header("Content-Type: application/json; charset=UTF-8");
    }
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit();
}

// Retrieve candidates from JSON data store
function getCandidatesData(): array {
    $dataFile = __DIR__ . '/data/candidates.json';
    if (!file_exists($dataFile)) {
        return [];
    }
    $raw = file_get_contents($dataFile);
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

// Save candidates data
function saveCandidatesData(array $candidates): bool {
    $dataFile = __DIR__ . '/data/candidates.json';
    return (bool) file_put_contents($dataFile, json_encode($candidates, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}
