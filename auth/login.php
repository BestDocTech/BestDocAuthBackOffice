<?php
session_start();

// Check if Firebase config exists
$configFile = __DIR__ . '/config/firebase-config.php';
if (!file_exists($configFile)) {
    die('Firebase configuration file not found. Please create config/firebase-config.php with valid Firebase credentials.');
}
$config = require_once $configFile;


// If user is already authenticated, redirect to success page or original destination
if (isset($_SESSION['firebase_user']) && isset($_SESSION['firebase_token'])) {
    $redirect_url = $_SESSION['redirect_after_login'] ?? $config['success_redirect_url'];
    unset($_SESSION['redirect_after_login']);
    header('Location: ' . $redirect_url);
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - BestDoc</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
        <div>
            <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-white">
                <svg class="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
            </div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-white">
                Sign in to your account
            </h2>
            <p class="mt-2 text-center text-sm text-gray-200">
                Access protected content
            </p>
        </div>
        
        <div class="bg-white rounded-lg shadow-xl p-8">
            <!-- Email/Password Login Form -->
            <form id="loginForm" class="space-y-6">
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700">
                        Email address
                    </label>
                    <div class="mt-1">
                        <input id="email" name="email" type="email" autocomplete="email" required
                               class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                               placeholder="Enter your email">
                    </div>
                </div>

                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <div class="mt-1">
                        <input id="password" name="password" type="password" autocomplete="current-password" required
                               class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                               placeholder="Enter your password">
                    </div>
                </div>

                <div>
                    <button type="submit" id="loginBtn"
                            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                        <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                            <svg class="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path>
                            </svg>
                        </span>
                        Sign in
                    </button>
                </div>
            </form>

            <!-- Error Message -->
            <div id="errorMessage" class="hidden mt-4 p-3 bg-red-100 border border-red-300 rounded-md">
                <p class="text-sm text-red-700"></p>
            </div>

            <!-- Loading Spinner -->
            <div id="loadingSpinner" class="hidden mt-4 flex justify-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        </div>
    </div>

    <script>
        // Firebase configuration
        const firebaseConfig = {
            apiKey: "<?php echo $config['apiKey']; ?>",
            authDomain: "<?php echo $config['authDomain']; ?>",
            projectId: "<?php echo $config['projectId']; ?>",
            storageBucket: "<?php echo $config['storageBucket']; ?>",
            messagingSenderId: "<?php echo $config['messagingSenderId']; ?>",
            appId: "<?php echo $config['appId']; ?>"
        };

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();

        // DOM elements
        const loginForm = document.getElementById('loginForm');
        const errorMessage = document.getElementById('errorMessage');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const loginBtn = document.getElementById('loginBtn');

        // Check for URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get('error');
        const clientIdParam = urlParams.get('client_id');
        
        if (errorParam === 'unauthorized') {
            showError('Access denied. You do not have permission to access this presentation.');
        }
        
        // Store client ID if provided for validation during login
        let requiredClientId = clientIdParam;

        // Utility functions
        function showError(message) {
            errorMessage.querySelector('p').textContent = message;
            errorMessage.classList.remove('hidden');
        }

        function hideError() {
            errorMessage.classList.add('hidden');
        }

        function showLoading() {
            loadingSpinner.classList.remove('hidden');
            loginBtn.disabled = true;
        }

        function hideLoading() {
            loadingSpinner.classList.add('hidden');
            loginBtn.disabled = false;
        }

        // Handle successful login
        async function handleLoginSuccess(user) {
            try {
                // Get Firestore database instance
                const db = firebase.firestore();
                
                // Fetch user data from Firestore
                let firestoreUser = null;
                try {
                    const userDoc = await db.collection('users').doc(user.uid).get();
                    if (userDoc.exists) {
                        firestoreUser = userDoc.data();
                    } else {
                        showError('User account not found in system. Please contact your administrator.');
                        return; // Stop login process
                    }
                } catch (firestoreError) {
                    console.error('Error fetching Firestore user data:', firestoreError);
                    showError('Unable to verify user account. Please try again later.');
                    return; // Stop login process
                }

                // Validate client access if required
                if (requiredClientId) {
                    const userClientId = firestoreUser.clientId;
                    const isGlobalAdmin = firestoreUser.isAdmin === true;
                    const isClientAdmin = firestoreUser.isClientAdmin === true;
                    
                    // Check if user has access to the required client
                    if (!isGlobalAdmin && userClientId !== requiredClientId && !(isClientAdmin && userClientId === requiredClientId)) {
                        showError('Access denied. You do not have permission to access this presentation.');
                        return;
                    }
                }

                // Send user data to PHP session
                const response = await fetch('../../auth/auth-handler.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'login',
                        user: {
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName,
                            photoURL: user.photoURL
                        },
                        firestoreUser: firestoreUser, // Include Firestore data
                        token: user.accessToken,
                        requiredClientId: requiredClientId // Include required client ID for server validation
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    window.location.href = data.redirect_url || '/';
                } else {
                    showError(data.error || 'Login failed. Please try again.');
                }
            } catch (error) {
                console.error('Error during login:', error);
                showError('An error occurred. Please try again.');
            } finally {
                hideLoading();
            }
        }

        // Email/Password login
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError();
            showLoading();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                // Get the ID token
                const token = await user.getIdToken();
                user.accessToken = token;
                
                handleLoginSuccess(user);
            } catch (error) {
                hideLoading();
                console.error('Login error:', error);
                showError("Login failed. Please try again.");
            }
        });
    </script>
</body>
</html> 