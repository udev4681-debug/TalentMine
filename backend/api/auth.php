<?php
require_once __DIR__ . '/../config.php';

$raw = file_get_contents('php://input');
$input = json_decode($raw, true) ?? $_POST;

$action = $input['action'] ?? ($_GET['action'] ?? 'login');
$email = trim($input['email'] ?? ($input['workEmail'] ?? ''));
$name = trim($input['name'] ?? ($input['firstName'] ?? 'User'));

if ($action === 'register') {
    jsonResponse([
        'status' => 'success',
        'message' => 'Account successfully registered.',
        'user' => [
            'id' => 'USR-' . rand(1000, 9999),
            'name' => $name,
            'email' => $email,
            'role' => 'Recruiter / Workspace Admin',
            'createdAt' => date('c')
        ]
    ]);
} elseif ($action === 'google') {
    // Simulated Google OAuth Token verification
    $googleId = $input['googleId'] ?? 'G-' . rand(100000, 999999);
    jsonResponse([
        'status' => 'success',
        'message' => 'Google authentication successful via Firebase/OAuth.',
        'user' => [
            'id' => $googleId,
            'name' => $name ?: 'Google User',
            'email' => $email ?: 'user@gmail.com',
            'avatar' => $input['photoURL'] ?? null,
            'provider' => 'google.com'
        ]
    ]);
} else {
    // Normal Login
    jsonResponse([
        'status' => 'success',
        'message' => 'Login successful.',
        'user' => [
            'id' => 'USR-1001',
            'name' => !empty($name) ? $name : ($email ? explode('@', $email)[0] : 'Workspace Owner'),
            'email' => $email ?: 'recruiter@talentmine.ai',
            'sessionToken' => bin2hex(random_bytes(16))
        ]
    ]);
}
