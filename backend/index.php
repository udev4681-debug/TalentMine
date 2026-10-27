<?php
require_once __DIR__ . '/config.php';

jsonResponse([
    'platform' => 'TalentMine Candidate Intelligence Platform API',
    'version' => '1.0.0',
    'status' => 'operational',
    'endpoints' => [
        'GET /backend/api/candidates.php' => 'Search and mine candidate data (params: country, city, type, skill, q, autoMine)',
        'GET /backend/api/stats.php' => 'Aggregated talent metrics and skill distributions',
        'GET /backend/api/export.php' => 'Download verified candidates as CSV or JSON (params: format=csv|json)',
        'POST /backend/api/auth.php' => 'Authentication endpoint (login, register, google)'
    ],
    'serverTime' => date('c')
]);
