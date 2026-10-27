<?php
require_once __DIR__ . '/../config.php';

$candidates = getCandidatesData();
$format = isset($_GET['format']) ? strtolower(trim($_GET['format'])) : 'csv';

if ($format === 'json') {
    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename="talentmine-candidates-' . date('Ymd-His') . '.json"');
    echo json_encode($candidates, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit();
}

// Default CSV export
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="talentmine-candidates-' . date('Ymd-His') . '.csv"');

$output = fopen('php://output', 'w');

// CSV Header
fputcsv($output, [
    'Candidate ID',
    'Full Name',
    'Designation',
    'Experience (Years)',
    'Skills',
    'Candidate Type',
    'Location',
    'Country',
    'City',
    'Work Email',
    'Phone',
    'Education',
    'Source',
    'Profile Link',
    'Validation Status'
]);

foreach ($candidates as $c) {
    fputcsv($output, [
        $c['id'] ?? '',
        $c['name'] ?? '',
        $c['designation'] ?? '',
        $c['experience'] ?? 0,
        implode(', ', $c['skills'] ?? []),
        $c['type'] ?? '',
        $c['location'] ?? '',
        $c['country'] ?? '',
        $c['city'] ?? '',
        $c['email'] ?? '',
        $c['phone'] ?? '',
        $c['education'] ?? '',
        $c['source'] ?? '',
        $c['profile'] ?? '',
        !empty($c['verified']) ? 'Verified' : 'Pending'
    ]);
}

fclose($output);
exit();
