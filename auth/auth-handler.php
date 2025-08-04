<?php
/**
 * Authentication Handler
 * 
 * Handles authentication requests from the client-side JavaScript
 */

session_start();

// Load Firebase configuration
$configFile = __DIR__ . '/config/firebase-config.php';
if (!file_exists($configFile)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Firebase configuration file not found']);
    exit();
}
$config = require_once $configFile;

// Set content type to JSON
header('Content-Type: application/json');

// Handle CORS if needed
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    exit(0);
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Get the raw POST data
$rawData = file_get_contents('php://input');
$data = json_decode($rawData, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    exit();
}

$action = $data['action'] ?? '';

switch ($action) {
    case 'login':
        handleLogin($data, $config);
        break;
    
    case 'logout':
        handleLogout();
        break;
    
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
        break;
}

/**
 * Handle user login
 */
function handleLogin($data, $config) {
    if (!isset($data['user']) || !isset($data['token'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing user data or token']);
        return;
    }

    $user = $data['user'];
    $token = $data['token'];

    // Validate required user fields
    if (!isset($user['uid']) || !isset($user['email'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing required user fields']);
        return;
    }

    // Check if user data from Firestore is provided
    $firestoreUser = $data['firestoreUser'] ?? null;
    
    if ($firestoreUser) {
        // Merge Firebase Auth user with Firestore user data
        $completeUser = array_merge($user, $firestoreUser);
    } else {
        // Use only Firebase Auth data (fallback)
        $completeUser = $user;
    }

    // Optional: Verify the Firebase ID token on server-side
    // This would require additional Firebase Admin SDK setup
    // For now, we'll trust the client-side verification
    
    // Store complete user data in session
    $_SESSION['firebase_user'] = json_encode($completeUser);
    $_SESSION['firebase_token'] = $token;
    $_SESSION['auth_timestamp'] = time();
    
    // Determine redirect URL
    $redirect_url = $_SESSION['redirect_after_login'] ?? $config['success_redirect_url'];
    unset($_SESSION['redirect_after_login']);

    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'redirect_url' => $redirect_url,
        'user' => $completeUser
    ]);
}

/**
 * Handle user logout
 */
function handleLogout() {
    // Clear all session data
    $_SESSION = array();
    
    // Destroy the session cookie
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    
    // Destroy the session
    session_destroy();

    echo json_encode([
        'success' => true,
        'message' => 'Logout successful'
    ]);
} 