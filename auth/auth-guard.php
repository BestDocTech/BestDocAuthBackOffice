<?php
/**
 * Firebase Authentication Guard
 * 
 * Include this file at the top of any PHP file or folder that needs protection
 * Example: require_once '../auth-guard.php';
 * 
 * For client-specific access control, create a 'client-config.php' file 
 * in the same directory as the protected file with:
 * <?php return ['client_id' => 'your-client-id-from-backoffice']; ?>
 */

session_start();

// Load Firebase configuration
$config = require_once __DIR__ . '/config/firebase-config.php';

/**
 * Check if user is authenticated via Firebase
 */
function isAuthenticated() {
    return isset($_SESSION['firebase_user']) && 
           isset($_SESSION['firebase_token']) &&
           isset($_SESSION['auth_timestamp']) &&
           (time() - $_SESSION['auth_timestamp']) < $GLOBALS['config']['session_timeout'];
}

/**
 * Redirect to login page if not authenticated or not authorized for the specified client
 * 
 * @param string $requiredClientId Required client ID to restrict access to
 */
function requireAuth($requiredClientId) {
    global $config;
    
    if (!isAuthenticated()) {
        // Store the current URL for redirect after login
        $_SESSION['redirect_after_login'] = $_SERVER['REQUEST_URI'];
        
        // Redirect to login page
        $login_url = $config['login_redirect_url'];
        
        // Handle relative vs absolute paths
        if (strpos($login_url, 'http') !== 0) {
            $login_url = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/') . '/' . ltrim($login_url, '/');
        }
        
        // Add client ID as query parameter
        $separator = strpos($login_url, '?') !== false ? '&' : '?';
        $login_url .= $separator . 'client_id=' . urlencode($requiredClientId);
        
        header('Location: ' . $login_url);
        exit();
    }

    // Check client access after authentication
    $user = getCurrentUser();
    if (!checkClientAccess($user, $requiredClientId)) {
        // User is authenticated but not authorized for this client
        // Clear session and redirect to login with error
        session_destroy();
        
        $login_url = $config['login_redirect_url'];
        
        // Handle relative vs absolute paths
        if (strpos($login_url, 'http') !== 0) {
            $login_url = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/') . '/' . ltrim($login_url, '/');
        }
        
        // Add error parameter and client ID to indicate unauthorized access
        $separator = strpos($login_url, '?') !== false ? '&' : '?';
        $login_url .= $separator . 'error=unauthorized&client_id=' . urlencode($requiredClientId);
        
        header('Location: ' . $login_url);
        exit();
    }
}

/**
 * Get current user data
 */
function getCurrentUser() {
    if (isAuthenticated()) {
        return json_decode($_SESSION['firebase_user'], true);
    }
    return null;
}

/**
 * Check if user has access to the specified client
 */
function checkClientAccess($userData, $requiredClientId) {
    // Client ID is always required
    if (empty($requiredClientId)) {
        return false;
    }

    // Global admins (isAdmin = true, no clientId) can access any presentation
    if (isset($userData['isAdmin']) && $userData['isAdmin'] === true) {
        return true;
    }

    // Check if user belongs to the required client
    if (isset($userData['clientId']) && $userData['clientId'] === $requiredClientId) {
        return true;
    }

    // Client admins can access their client's presentations
    if (isset($userData['isClientAdmin']) && $userData['isClientAdmin'] === true && 
        isset($userData['clientId']) && $userData['clientId'] === $requiredClientId) {
        return true;
    }

    return false;
}

// Note: Authentication is no longer automatic
// Call requireAuth($clientId) from your index.php file with a mandatory client ID