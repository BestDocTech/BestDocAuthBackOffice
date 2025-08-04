import { API_BASE_URL } from './api.base.config.js';

// Firebase Configuration Module
// This module handles Firebase config loading and initialization

// Firebase state
let firebaseConfig = null;
let auth = null;
let db = null;
let isInitialized = false;

// Load Firebase config from API and initialize
export async function initializeFirebase() {
  // Return early if already initialized
  if (isInitialized) {
    return { auth, db, config: firebaseConfig };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/firebase-config`);
    const configResult = await response.json();

    if (configResult.success) {
      firebaseConfig = configResult.config;

      // Initialize Firebase
      firebase.initializeApp(firebaseConfig);
      auth = firebase.auth();
      db = firebase.firestore();
      isInitialized = true;

      console.log('Firebase initialized successfully');
      return { auth, db, config: firebaseConfig };
    } else {
      throw new Error('Failed to get Firebase config from API');
    }
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw new Error(`Failed to initialize Firebase: ${error.message}`);
  }
}

// Get Firebase instances (must call initializeFirebase first)
export function getFirebaseInstances() {
  if (!isInitialized) {
    throw new Error(
      'Firebase not initialized. Call initializeFirebase() first.'
    );
  }
  return { auth, db, config: firebaseConfig };
}

// Helper function to show error (can be overridden)
export function showFirebaseError(message) {
  console.error('Firebase Error:', message);
  // Can be customized based on the page's error handling
  if (typeof showError === 'function') {
    showError(message);
  } else {
    alert(message);
  }
}
