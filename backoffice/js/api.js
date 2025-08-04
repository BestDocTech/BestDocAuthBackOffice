import { API_BASE_URL } from './api.base.config.js';
import { getFirebaseInstances } from './firebase.js';

// Simple API functions
export const api = {
  // Health check
  async health() {
    const response = await fetch(`${API_BASE_URL}/health`);
    return this.handleResponse(response);
  },

  async getAuthHeader() {
    const { auth } = getFirebaseInstances();
    const token = await auth.currentUser.getIdToken();
    return {
      Authorization: `Bearer ${token}`,
    };
  },

  // Helper function to handle API responses
  async handleResponse(response) {
    const data = await response.json();

    if (!response.ok) {
      // Create an error object with the response data
      const error = new Error(
        data.message || data.error || `HTTP ${response.status}`
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  },

  // Create user
  async createUser(userData) {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await this.getAuthHeader()),
      },
      body: JSON.stringify(userData),
    });
    return this.handleResponse(response);
  },

  // Delete user
  async deleteUser(uid) {
    const response = await fetch(`${API_BASE_URL}/users/${uid}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(await this.getAuthHeader()),
      },
    });
    return this.handleResponse(response);
  },

  // Send password setup email
  async sendPasswordSetupEmail(email) {
    const response = await fetch(`${API_BASE_URL}/users/send-password-setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await this.getAuthHeader()),
      },
      body: JSON.stringify({ email }),
    });
    return this.handleResponse(response);
  },

  // Get Firebase config
  async getFirebaseConfig() {
    const response = await fetch(`${API_BASE_URL}/firebase-config`);
    return this.handleResponse(response);
  },
};
