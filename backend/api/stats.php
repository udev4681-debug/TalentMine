<?php
require_once __DIR__ . '/../config.php';

$candidates = getCandidatesData();
$total = count($candidates);

$students = 0;
$professionals = 0;
$countries = [];
$skillsCount = [];

foreach ($candidates as $c) {
    if (isset($c['type']) && $c['type'] === 'student') {
        $students++;
    } else {
        $professionals++;
    }

    if (!empty($c['country'])) {
        $countries[$c['country']] = ($countries[$c['country']] ?? 0) + 1;
    }

    if (!empty($c['skills']) && is_array($c['skills'])) {
        foreach ($c['skills'] as $s) {
            $skillsCount[$s] = ($skillsCount[$s] ?? 0) + 1;
        }
    }
}

arsort($skillsCount);
arsort($countries);

jsonResponse([
    'status' => 'success',
    'totalCandidates' => $total,
    'totalStudents' => $students,
    'totalProfessionals' => $professionals,
    'skillsDistribution' => array_slice($skillsCount, 0, 10, true),
    'countryDistribution' => array_slice($countries, 0, 8, true),
    'lastMined' => date('Y-m-d H:i:s')
]);
