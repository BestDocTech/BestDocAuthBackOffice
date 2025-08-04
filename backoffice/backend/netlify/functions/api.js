const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK
initializeApp({
  credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS)),
});

// Initialize Firestore
const db = getFirestore();

// Create Express app
const app = express();

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid authorization header',
        message: 'Please provide a valid Bearer token',
      });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify the Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(idToken);

    // Add user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
    };

    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({
      error: 'Invalid or expired token',
      message: 'Please login again',
    });
  }
};

// Admin authorization middleware
const requireAdmin = async (req, res, next) => {
  try {
    // Check user's admin status in Firestore
    const userDoc = await db.collection('users').doc(req.user.uid).get();

    if (!userDoc.exists) {
      return res.status(403).json({
        error: 'User not found in system',
        message: 'Please contact your administrator',
      });
    }

    const userData = userDoc.data();
    const isAdmin = userData.isAdmin || userData.isClientAdmin;

    if (!isAdmin) {
      return res.status(403).json({
        error: 'Admin access required',
        message: 'This operation requires admin privileges',
      });
    }

    // Add user data to request for use in endpoints
    req.userData = userData;

    next();
  } catch (error) {
    console.error('Error checking admin status:', error);
    return res.status(500).json({
      error: 'Failed to verify admin status',
      message: 'Please try again later',
    });
  }
};

// Create a router for API routes
const apiRouter = express.Router();

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    function: 'api',
    environment: process.env.NODE_ENV || 'development',
    region: process.env.AWS_REGION || 'unknown',
    memory: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE || 'unknown',
    timeout: process.env.AWS_LAMBDA_FUNCTION_TIMEOUT || 'unknown',
  };

  res.json(healthData);
});

// Get Firebase config
apiRouter.get('/firebase-config', (req, res) => {
  try {
    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    };

    // Check if all required environment variables are present
    const requiredVars = [
      'FIREBASE_API_KEY',
      'FIREBASE_AUTH_DOMAIN',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_STORAGE_BUCKET',
      'FIREBASE_MESSAGING_SENDER_ID',
      'FIREBASE_APP_ID',
    ];
    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      return res.status(500).json({
        error: 'Missing required environment variables',
        missingVariables: missingVars,
      });
    }

    res.json({
      success: true,
      config: firebaseConfig,
    });
  } catch (error) {
    console.error('Error getting Firebase config:', error);
    res.status(500).json({
      error: 'Failed to get Firebase config',
      details: error.message,
    });
  }
});

// Admin-only: Delete user from Firebase Auth
apiRouter.delete(
  '/users/:uid',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { uid } = req.params;

      if (!uid) {
        return res.status(400).json({
          error: 'UID is required',
        });
      }

      // Log the admin action
      console.log(
        `Admin ${req.user.email} (${req.user.uid}) is deleting user ${uid}`
      );

      // Delete the user from Firebase Auth using UID
      await getAuth().deleteUser(uid);
      await db.collection('users').doc(uid).delete();

      res.json({
        success: true,
        message: 'User deleted from Firebase Auth',
      });
    } catch (error) {
      console.error('Error deleting user from Firebase Auth:', error);
      res.status(500).json({
        error: 'Failed to delete user from Firebase Auth',
        details: error.message,
      });
    }
  }
);

// Admin-only: Create user in Firebase Auth
apiRouter.post('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    // Log the admin action
    console.log(
      `Admin ${req.user.email} (${req.user.uid}) is creating user ${email}`
    );

    // Create user in Firebase Auth using Admin SDK
    const userRecord = await getAuth().createUser({
      email: email,
      password: password,
      displayName: displayName,
    });

    res.json({
      success: true,
      uid: userRecord.uid,
      message: 'User created in Firebase Auth',
    });
  } catch (error) {
    console.error('Error creating user in Firebase Auth:', error);
    res.status(500).json({
      error: 'Failed to create user in Firebase Auth',
      details: error.message,
    });
  }
});

// Mount the API router at /api
app.use('/api', apiRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  console.log('404', req.path);
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
  });
});

// Export the serverless handler
exports.handler = serverless(app);
