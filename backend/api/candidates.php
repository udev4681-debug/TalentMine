<?php
require_once __DIR__ . '/../config.php';

// Accept query params via GET or JSON payload via POST
$input = $_GET;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = json_decode(file_get_contents('php://input'), true);
    if (is_array($rawInput)) {
        $input = array_merge($input, $rawInput);
    }
}

$candidates = getCandidatesData();

// Filter parameters
$country = isset($input['country']) ? trim($input['country']) : '';
$city    = isset($input['city'])    ? trim($input['city'])    : '';
$type    = isset($input['type'])    ? strtolower(trim($input['type'])) : '';
$skill   = isset($input['skill'])   ? strtolower(trim($input['skill'])) : '';
$q       = isset($input['q'])       ? strtolower(trim($input['q']))    : '';

$filtered = array_values(array_filter($candidates, function($c) use ($country, $city, $type, $skill, $q) {
    if (!empty($country) && strcasecmp($c['country'], $country) !== 0) return false;
    if (!empty($city)    && strcasecmp($c['city'],    $city)    !== 0) return false;
    if (!empty($type)    && strcasecmp($c['type'],    $type)    !== 0) return false;

    if (!empty($skill)) {
        $hasSkill = false;
        foreach ((array)($c['skills'] ?? []) as $s) {
            if (stripos($s, $skill) !== false) { $hasSkill = true; break; }
        }
        if (!$hasSkill) return false;
    }

    if (!empty($q)) {
        $searchSpace = strtolower(
            ($c['name']        ?? '') . ' ' .
            ($c['designation'] ?? '') . ' ' .
            implode(' ', (array)($c['skills'] ?? [])) . ' ' .
            ($c['location']    ?? '') . ' ' .
            ($c['email']       ?? '')
        );
        if (strpos($searchSpace, $q) === false) return false;
    }

    return true;
}));

jsonResponse([
    'status'  => 'success',
    'query'   => compact('country', 'city', 'type', 'skill', 'q'),
    'count'   => count($filtered),
    'results' => $filtered,
    'timestamp' => date('c')
]);
