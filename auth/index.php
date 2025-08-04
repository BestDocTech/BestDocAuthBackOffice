<?php
// Protect this file with Firebase authentication
require_once __DIR__ . '/auth/auth-guard.php';

// Define the client ID for this presentation
$REQUIRED_CLIENT_ID = 'your-client-id-here'; // Copy from BestDoc Back Office

// Require authentication with client restriction
requireAuth($REQUIRED_CLIENT_ID);

// If we reach here, user is authenticated and authorized for this client


// Set proper content type
header('Content-Type: text/html; charset=utf-8');


$filename = isset($_GET['file']) ? $_GET['file'] : 'index.html';

// Read the index.html file
$html_content = file_get_contents($filename);

// Output the content
echo $html_content;