<?php
/**
 * TalentMine Backend Configuration & Helpers
 * Supports MySQL Database (PDO) with automatic JSON fallback
 */

$isCli = (php_sapi_name() === 'cli');

// Database configuration defaults (standard XAMPP / Localhost MySQL settings)
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'talentmine_db');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : '');

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

/**
 * Get PDO Database Connection
 * Returns PDO instance if MySQL is available, null if offline or uninitialized
 */
function getDbConnection(): ?PDO {
    static $pdo = null;
    static $connectionAttempted = false;

    if ($connectionAttempted) {
        return $pdo;
    }
    $connectionAttempted = true;

    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 2, // 2-second timeout to prevent stalling
        ]);
        return $pdo;
    } catch (Throwable $e) {
        // Database not reachable or talentmine_db not created yet; fallback gracefully
        $pdo = null;
        return null;
    }
}

/**
 * Check if Database is connected and candidates table exists
 */
function isDbReady(): bool {
    $db = getDbConnection();
    if (!$db) return false;
    try {
        $stmt = $db->query("SHOW TABLES LIKE 'candidates'");
        return (bool) $stmt->fetch();
    } catch (Throwable $e) {
        return false;
    }
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

// Retrieve candidates (MySQL primary, JSON file fallback)
function getCandidatesData(): array {
    $db = getDbConnection();

    if ($db) {
        try {
            $stmt = $db->query("SELECT * FROM `candidates` ORDER BY `id` ASC");
            $rows = $stmt->fetchAll();
            if (!empty($rows)) {
                return array_map(function($row) {
                    // Normalize skills
                    if (is_string($row['skills'])) {
                        $decoded = json_decode($row['skills'], true);
                        $row['skills'] = is_array($decoded) ? $decoded : array_map('trim', explode(',', $row['skills']));
                    }
                    $row['experience'] = (int) $row['experience'];
                    $row['verified'] = (bool) $row['verified'];
                    $row['matchScore'] = isset($row['matchScore']) ? (int) $row['matchScore'] : 90;
                    return $row;
                }, $rows);
            }
        } catch (Throwable $e) {
            // If MySQL table doesn't exist yet, proceed to JSON fallback
        }
    }

    // Fallback: local JSON file
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
    $savedJson = (bool) file_put_contents($dataFile, json_encode($candidates, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

    $db = getDbConnection();
    if ($db) {
        try {
            $stmt = $db->prepare("
                INSERT INTO `candidates` (
                    `id`, `name`, `designation`, `experience`, `skills`, `type`,
                    `country`, `city`, `location`, `email`, `phone`, `source`,
                    `profile`, `education`, `verified`, `status`, `matchScore`
                ) VALUES (
                    :id, :name, :designation, :experience, :skills, :type,
                    :country, :city, :location, :email, :phone, :source,
                    :profile, :education, :verified, :status, :matchScore
                ) ON DUPLICATE KEY UPDATE
                    `name` = VALUES(`name`),
                    `designation` = VALUES(`designation`),
                    `skills` = VALUES(`skills`),
                    `matchScore` = VALUES(`matchScore`)
            ");

            foreach ($candidates as $c) {
                $skillsJson = is_array($c['skills']) ? json_encode($c['skills']) : $c['skills'];
                $stmt->execute([
                    ':id' => $c['id'],
                    ':name' => $c['name'],
                    ':designation' => $c['designation'],
                    ':experience' => (int) ($c['experience'] ?? 0),
                    ':skills' => $skillsJson,
                    ':type' => $c['type'] ?? 'professional',
                    ':country' => $c['country'] ?? '',
                    ':city' => $c['city'] ?? '',
                    ':location' => $c['location'] ?? '',
                    ':email' => $c['email'] ?? '',
                    ':phone' => $c['phone'] ?? null,
                    ':source' => $c['source'] ?? null,
                    ':profile' => $c['profile'] ?? null,
                    ':education' => $c['education'] ?? null,
                    ':verified' => !empty($c['verified']) ? 1 : 0,
                    ':status' => $c['status'] ?? 'Actively Looking',
                    ':matchScore' => (int) ($c['matchScore'] ?? 90),
                ]);
            }
        } catch (Throwable $e) {
            // Keep JSON save success even if DB query errored
        }
    }

    return $savedJson;
}
