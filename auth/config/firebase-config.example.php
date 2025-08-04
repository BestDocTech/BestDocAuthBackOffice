<?php
/**
 * Firebase Configuration
 * 
 * Replace the values below with your actual Firebase project credentials
 * You can find these in your Firebase console under Project Settings > General > Your apps
 */

return [
    'apiKey' => "your-api-key-here",
    'authDomain' => "your-project-id.firebaseapp.com",
    'projectId' => "your-project-id",
    'storageBucket' => "your-project-id.appspot.com",
    'messagingSenderId' => "your-sender-id",
    'appId' => "your-app-id",
    
    // Additional settings
    'login_redirect_url' => '/login.php',
    'success_redirect_url' => '/',
    'session_timeout' => 3600 // 1 hour in seconds
];