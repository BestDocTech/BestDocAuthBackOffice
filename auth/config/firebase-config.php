<?php
/**
 * Firebase Configuration
 * 
 * Replace the values below with your actual Firebase project credentials
 * You can find these in your Firebase console under Project Settings > General > Your apps
 */

return [
    "apiKey" => "AIzaSyDPFVyihimkH9HhcmXHxAY4niyl2uLpdrE",
    "authDomain" => "bestdoc-dev-85e9a.firebaseapp.com",
    "projectId" => "bestdoc-dev-85e9a",
    "storageBucket" => "bestdoc-dev-85e9a.firebasestorage.app",
    "messagingSenderId" => "1076083253325",
    "appId" => "1:1076083253325:web:3aae4c64ca23b13ac0bc04",
    
    // Additional settings
    'login_redirect_url' => '/login.php',
    'success_redirect_url' => '/',
    'session_timeout' => 3600 // 1 hour in seconds
]; 