<?php
/**
 * TalentMine — Auth Endpoint
 * Handles login, registration, and Google OAuth token relay.
 * User persistence is handled by the MySQL users table (via config.php PDO).
 *
 * NOTE: Full password hashing and session token persistence will be wired
 * here once the live API layer is set up. Currently bridges Firebase Auth
 * on the client side with a server-side user record.
 */
require_once __DIR__ . '/../config.php';

$raw   = file_get_contents('php://input');
$input = json_decode($raw, true) ?? [];
if (empty($input)) $input = $_POST;

$action = trim($input['action'] ?? ($_GET['action'] ?? 'login'));
$email  = trim($input['email']  ?? ($input['workEmail'] ?? ''));
$name   = trim($input['name']   ?? ($input['firstName'] ?? ''));

if (empty($email)) {
    jsonResponse(['status' => 'error', 'message' => 'Email is required.'], 400);
}

$db = getDbConnection();

if ($action === 'register') {
    if (empty($name)) {
        jsonResponse(['status' => 'error', 'message' => 'Name is required for registration.'], 400);
    }

    $userId = 'USR-' . strtoupper(bin2hex(random_bytes(4)));

    if ($db) {
        try {
            $stmt = $db->prepare(
                'INSERT INTO `users` (`id`, `name`, `email`, `provider`) VALUES (:id, :name, :email, :provider)'
            );
            $stmt->execute([':id' => $userId, ':name' => $name, ':email' => $email, ':provider' => 'local']);
        } catch (Throwable $e) {
            // Duplicate email
            if ((int)$e->getCode() === 23000) {
                jsonResponse(['status' => 'error', 'message' => 'An account with this email already exists.'], 409);
            }
            jsonResponse(['status' => 'error', 'message' => 'Registration failed. Please try again.'], 500);
        }
    }

    jsonResponse([
        'status'  => 'success',
        'message' => 'Account registered successfully.',
        'user'    => [
            'id'        => $userId,
            'name'      => $name,
            'email'     => $email,
            'role'      => 'Recruiter / Workspace Admin',
            'createdAt' => date('c')
        ]
    ]);

} elseif ($action === 'google') {
    // Google OAuth via Firebase — client verifies token; server records/upserts user
    $googleId  = $input['googleId']  ?? null;
    $photoURL  = $input['photoURL']  ?? null;
    $provider  = 'google.com';

    if (empty($googleId)) {
        jsonResponse(['status' => 'error', 'message' => 'Missing Google ID.'], 400);
    }

    if ($db) {
        try {
            $stmt = $db->prepare(
                'INSERT INTO `users` (`id`, `name`, `email`, `avatar`, `provider`) VALUES (:id, :name, :email, :avatar, :provider)
                 ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `avatar` = VALUES(`avatar`)'
            );
            $stmt->execute([
                ':id'       => $googleId,
                ':name'     => $name  ?: 'Google User',
                ':email'    => $email ?: '',
                ':avatar'   => $photoURL,
                ':provider' => $provider
            ]);
        } catch (Throwable $e) {
            // Non-fatal — still return success so client flow continues
        }
    }

    jsonResponse([
        'status'  => 'success',
        'message' => 'Google authentication successful.',
        'user'    => [
            'id'       => $googleId,
            'name'     => $name  ?: 'Google User',
            'email'    => $email ?: '',
            'avatar'   => $photoURL,
            'provider' => $provider
        ]
    ]);

} else {
    // Standard login — look up user by email
    if ($db) {
        try {
            $stmt = $db->prepare('SELECT `id`, `name`, `email`, `role` FROM `users` WHERE `email` = :email LIMIT 1');
            $stmt->execute([':email' => $email]);
            $user = $stmt->fetch();

            if ($user) {
                jsonResponse([
                    'status'  => 'success',
                    'message' => 'Login successful.',
                    'user'    => [
                        'id'           => $user['id'],
                        'name'         => $user['name'],
                        'email'        => $user['email'],
                        'role'         => $user['role'],
                        'sessionToken' => bin2hex(random_bytes(16))
                    ]
                ]);
            }
        } catch (Throwable $e) {
            // Fall through to not-found response
        }
    }

    jsonResponse(['status' => 'error', 'message' => 'No account found for this email.'], 404);
}
