import { initializeFirebase } from './firebase.js';
import { api } from './api.js';

// Firebase instances (will be set after initialization)
let auth = null;
let db = null;

// Global state
let currentUser = null;
let currentClient = null;
let clients = [];
let users = [];

// DOM elements
const loadingScreen = document.getElementById('loadingScreen');
const loginPage = document.getElementById('loginPage');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const loginLoading = document.getElementById('loginLoading');
const logoutBtn = document.getElementById('logoutBtn');
const clientSelector = document.getElementById('clientSelector');
const clientSelect = document.getElementById('clientSelect');
const currentUserEmail = document.getElementById('currentUserEmail');
const currentUserRole = document.getElementById('currentUserRole');
const pageTitle = document.getElementById('pageTitle');

// Page elements
const dashboardPage = document.getElementById('dashboardPage');
const usersPage = document.getElementById('usersPage');
const clientsPage = document.getElementById('clientsPage');
const settingsPage = document.getElementById('settingsPage');
const clientsLink = document.getElementById('clientsLink');
const settingsLink = document.getElementById('settingsLink');

// Dashboard elements
const totalUsers = document.getElementById('totalUsers');
const totalClients = document.getElementById('totalClients');
const totalClientsTile = document.getElementById('totalClientsTile');
const currentClientDisplay = document.getElementById('currentClient');
const currentClientTile = document.getElementById('currentClientTile');

// Users page elements
const createUserBtn = document.getElementById('createUserBtn');
const usersTableBody = document.getElementById('usersTableBody');
const createUserModal = document.getElementById('createUserModal');
const createUserForm = document.getElementById('createUserForm');
const cancelCreateUser = document.getElementById('cancelCreateUser');

// Clients page elements
const createClientBtn = document.getElementById('createClientBtn');
const clientsTableBody = document.getElementById('clientsTableBody');
const createClientModal = document.getElementById('createClientModal');
const createClientForm = document.getElementById('createClientForm');
const cancelCreateClient = document.getElementById('cancelCreateClient');

// Settings page elements
const createAdminBtn = document.getElementById('createAdminBtn');
const adminsTableBody = document.getElementById('adminsTableBody');
const createAdminModal = document.getElementById('createAdminModal');
const createAdminForm = document.getElementById('createAdminForm');
const cancelCreateAdmin = document.getElementById('cancelCreateAdmin');
const generateAdminPasswordBtn = document.getElementById(
  'generateAdminPasswordBtn'
);

// Utility functions
function showLoading() {
  loadingScreen.classList.remove('hidden');
}

function hideLoading() {
  loadingScreen.classList.add('hidden');
}

function showError(message) {
  loginError.querySelector('p').textContent = message;
  loginError.classList.remove('hidden');
}

function hideError() {
  loginError.classList.add('hidden');
}

function showLoginLoading() {
  loginLoading.classList.remove('hidden');
}

function hideLoginLoading() {
  loginLoading.classList.add('hidden');
}

// Generate a random password for internal use
function generateRandomPassword() {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function formatDate(timestamp) {
  if (!timestamp) return '-';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });
  return dateFormatter.format(date);
}

function showModal(modalId) {
  document.getElementById(modalId).classList.remove('hidden');
}

function hideModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

function showConfirmDialog(title, text, callback) {
  Swal.fire({
    title: title,
    text: text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!',
  }).then((result) => {
    if (result.isConfirmed) {
      callback();
    }
  });
}

// Navigation
function navigateTo(page) {
  // Hide all pages
  document
    .querySelectorAll('.page-content')
    .forEach((p) => p.classList.add('hidden'));

  // Show selected page
  const targetPage = document.getElementById(page + 'Page');
  if (targetPage) {
    targetPage.classList.remove('hidden');
  }

  // Update page title
  const titles = {
    dashboard: 'Dashboard',
    users: 'Users Management',
    clients: 'Clients Management',
    settings: 'Settings',
  };
  pageTitle.textContent = titles[page] || 'Dashboard';

  // Update active nav link
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.classList.remove('bg-indigo-700', 'text-white');
    link.classList.add('text-indigo-100');
  });

  const activeLink = document.querySelector(`[href="#${page}"]`);
  if (activeLink) {
    activeLink.classList.remove('text-indigo-100');
    activeLink.classList.add('bg-indigo-700', 'text-white');
  }

  // Load page data
  if (page === 'dashboard') {
    loadDashboard();
  } else if (page === 'users') {
    loadUsers();
  } else if (page === 'clients') {
    loadClients();
  } else if (page === 'settings') {
    loadSettings();
  }
}

// Authentication
function handleAuthStateChanged(user) {
  if (user) {
    // User is signed in
    currentUser = user;
    checkUserInFirestore(user);
  } else {
    // User is signed out
    currentUser = null;
    showLoginPage();
  }
}

function checkUserInFirestore(user) {
  db.collection('users')
    .where('email', '==', user.email)
    .get()
    .then((snapshot) => {
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();

        // Check if user has admin or client admin privileges
        if (!userData.isAdmin && !userData.isClientAdmin) {
          // Regular user - not authorized for back office
          auth.signOut();
          showError(
            'Access denied. Only administrators can access the back office.'
          );
          return;
        }

        currentUser = { ...user, ...userData, docId: snapshot.docs[0].id };

        // Clear login form on successful login
        loginForm.reset();

        showMainApp();
        setupUserInterface();
      } else {
        // User not found in Firestore
        auth.signOut();
        showError('User not authorized to access the back office.');
      }
    })
    .catch((error) => {
      console.error('Error checking user:', error);
      auth.signOut();
      showError('Error checking user authorization.');
    });
}

function showLoginPage() {
  hideLoading();
  loginPage.classList.remove('hidden');
  mainApp.classList.add('hidden');
}

function showMainApp() {
  hideLoading();
  loginPage.classList.add('hidden');
  mainApp.classList.remove('hidden');
  navigateTo('dashboard');
}

function setupUserInterface() {
  // Update user info
  currentUserEmail.textContent = `${currentUser.firstName} ${currentUser.lastName}`;

  if (currentUser.isAdmin) {
    currentUserRole.textContent = 'Global Admin';
    clientsLink.classList.remove('hidden');
    settingsLink.classList.remove('hidden');
    clientSelector.classList.remove('hidden'); // Show client selector for Global Admins
    loadClientSelector();
  } else {
    currentUserRole.textContent = 'Client Admin';
    clientsLink.classList.add('hidden');
    settingsLink.classList.add('hidden');
    loadClientSelector();
  }
}

// Client Management
function loadClientSelector() {
  db.collection('clients')
    .get()
    .then((snapshot) => {
      clients = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      clientSelect.innerHTML = '<option value="">Select Client</option>';
      clients.forEach((client) => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.Name;
        clientSelect.appendChild(option);
      });
    })
    .catch((error) => {
      console.error('Error loading clients:', error);
    });
}

function loadClients() {
  if (!currentUser.isAdmin) return;

  db.collection('clients')
    .orderBy('createdAt', 'desc')
    .get()
    .then((snapshot) => {
      clients = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      renderClientsTable();
    })
    .catch((error) => {
      console.error('Error loading clients:', error);
    });
}

function renderClientsTable() {
  clientsTableBody.innerHTML = '';

  clients.forEach((client) => {
    const row = document.createElement('tr');
    row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${client.Name}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div class="flex items-center space-x-2">
                    <span class="font-mono text-xs bg-gray-100 px-2 py-1 rounded" title="${
                      client.id
                    }">${client.id.substring(0, 8)}...</span>
                    <button class="copy-client-id-btn text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50" title="Copy Client ID">
                        <i class="fas fa-copy text-xs"></i>
                    </button>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatDate(client.createdAt)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button class="delete-client-btn text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50" title="Delete Client">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

    // Add event listener to the copy button
    const copyBtn = row.querySelector('.copy-client-id-btn');
    copyBtn.addEventListener('click', () => {
      copyClientId(client.id, client.Name);
    });

    // Add event listener to the delete button
    const deleteBtn = row.querySelector('.delete-client-btn');
    deleteBtn.addEventListener('click', () => {
      deleteClient(client.id, client.Name);
    });

    clientsTableBody.appendChild(row);
  });
}

function createClient(clientData) {
  return db.collection('clients').add({
    Name: clientData.name,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

function deleteClient(clientId, clientName) {
  showConfirmDialog(
    'Delete Client',
    `Are you sure you want to delete "${clientName}"? This action cannot be undone.`,
    () => {
      // First, delete all users associated with this client
      db.collection('users')
        .where('clientId', '==', clientId)
        .get()
        .then((snapshot) => {
          const deletePromises = snapshot.docs.map((doc) => doc.ref.delete());
          return Promise.all(deletePromises);
        })
        .then(() => {
          // Then delete the client
          return db.collection('clients').doc(clientId).delete();
        })
        .then(() => {
          Swal.fire('Deleted!', 'Client has been deleted.', 'success');
          loadClients();
        })
        .catch((error) => {
          console.error('Error deleting client:', error);
          Swal.fire('Error!', 'Failed to delete client.', 'error');
        });
    }
  );
}

function copyClientId(clientId, clientName) {
  // Use the modern Clipboard API if available
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(clientId)
      .then(() => {
        // Show success notification
        Swal.fire({
          title: 'Copied!',
          text: `Client ID for "${clientName}" has been copied to clipboard`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        });
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
        // Fallback to manual copy
        fallbackCopyTextToClipboard(clientId, clientName);
      });
  } else {
    // Fallback for older browsers or non-secure contexts
    fallbackCopyTextToClipboard(clientId, clientName);
  }
}

function fallbackCopyTextToClipboard(text, clientName) {
  const textArea = document.createElement('textarea');
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.position = 'fixed';

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    if (successful) {
      Swal.fire({
        title: 'Copied!',
        text: `Client ID for "${clientName}" has been copied to clipboard`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
    } else {
      throw new Error('Copy command failed');
    }
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
    // Show the client ID in a modal for manual copying
    Swal.fire({
      title: `Client ID for "${clientName}"`,
      text: text,
      icon: 'info',
      confirmButtonText: 'Close',
      customClass: {
        content: 'font-mono text-sm',
      },
    });
  }

  document.body.removeChild(textArea);
}

// User Management
function loadUsers() {
  // For Global Admins, require a client to be selected
  if (currentUser.isAdmin && !currentClient) {
    // Hide the create user button
    createUserBtn.classList.add('hidden');

    usersTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-12 text-center">
          <div class="flex flex-col items-center">
            <i class="fas fa-users text-4xl text-gray-300 mb-4"></i>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Select a Client</h3>
            <p class="text-gray-500 max-w-sm">
              Please select a client from the dropdown above to view and manage users for that client.
            </p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  // Show the create user button when a client is selected
  createUserBtn.classList.remove('hidden');

  let query = db.collection('users');

  if (!currentUser.isAdmin) {
    // For client admins, only show users from their client
    query = query.where('clientId', '==', currentUser.clientId);
  } else {
    // For global admins, filter by selected client
    query = query.where('clientId', '==', currentClient);
  }

  // Always exclude Global Admins from the users list
  query = query.where('isAdmin', '==', false);

  query
    .orderBy('createdAt', 'desc')
    .get()
    .then((snapshot) => {
      users = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      renderUsersTable();
    })
    .catch((error) => {
      console.error('Error loading users:', error);
    });
}

function renderUsersTable() {
  usersTableBody.innerHTML = '';

  if (users.length === 0) {
    usersTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-12 text-center">
          <div class="flex flex-col items-center">
            <i class="fas fa-users text-4xl text-gray-300 mb-4"></i>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
            <p class="text-gray-500 max-w-sm">
              No users found for this client. Click "Create User" to add the first user.
            </p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  users.forEach((user) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900">
          ${user.firstName} ${user.lastName}
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${user.email}
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="text-sm">
          ${user.isClientAdmin ? '🛡️ Client Admin' : '👤 User'}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${formatDate(user.createdAt)}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div class="flex space-x-3">
          <button class="send-email-btn inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" title="Send Password Setup Email">
            <i class="fas fa-envelope mr-1"></i>
            Send link
          </button>
          <button class="delete-user-btn inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" title="Delete User">
            <i class="fas fa-trash mr-1"></i>
            Delete
          </button>
        </div>
      </td>
    `;

    // Add event listeners
    const sendEmailBtn = row.querySelector('.send-email-btn');
    sendEmailBtn.addEventListener('click', () => {
      sendPasswordSetupEmail(user.email, `${user.firstName} ${user.lastName}`);
    });

    const deleteBtn = row.querySelector('.delete-user-btn');
    deleteBtn.addEventListener('click', () => {
      deleteUser(user.id, `${user.firstName} ${user.lastName}`);
    });

    usersTableBody.appendChild(row);
  });
}

// Send password setup email
async function sendPasswordSetupEmail(email, userName) {
  try {
    await auth.sendPasswordResetEmail(email);
    Swal.fire(
      'Email Sent!',
      `Password setup email has been sent to ${userName} (${email}).`,
      'success'
    );
  } catch (error) {
    console.error('Error sending password setup email:', error);
    Swal.fire(
      'Error!',
      'Failed to send password setup email. Please try again.',
      'error'
    );
  }
}

async function createUser(userData) {
  try {
    // Create user using server-side API (Admin SDK) with temporary password
    const tempPassword = generateRandomPassword(); // Generate a temporary password
    const result = await api.createUser({
      email: userData.email,
      password: tempPassword,
      displayName: `${userData.firstName} ${userData.lastName}`,
    });

    // Create the user document in Firestore
    const userDoc = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      uid: result.uid,
      isClientAdmin: userData.isClientAdmin || false,
      isAdmin: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    if (currentUser.isAdmin) {
      // Global admin can assign to any client
      userDoc.clientId = currentClient || userData.clientId;
    } else {
      // Client admin can only create users for their client
      userDoc.clientId = currentUser.clientId;
    }

    // Use the UID as the document ID
    await db.collection('users').doc(result.uid).set(userDoc);

    // Send password setup email
    await auth.sendPasswordResetEmail(userData.email);

    return result;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

function deleteUser(userId, userName) {
  // Check if user is trying to delete themselves
  if (userId === currentUser.docId) {
    Swal.fire({
      title: '⚠️ Delete Your Own Account?',
      html: `
        <div class="text-left">
          <p class="mb-3">You are about to delete your own account!</p>
          <div class="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
            <div class="flex">
              <div class="flex-shrink-0">
                <i class="fas fa-exclamation-triangle text-red-400"></i>
              </div>
              <div class="ml-3 text-sm text-red-700">
                <strong>Warning:</strong> This will immediately log you out and permanently delete your account. You won't be able to access the system anymore.
              </div>
            </div>
          </div>
          <p class="text-sm text-gray-600">Are you absolutely sure you want to proceed?</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete My Account',
      cancelButtonText: 'Cancel',
      focusCancel: true,
    }).then((result) => {
      if (result.isConfirmed) {
        performUserDeletion(userId, userName, true); // true = self-deletion
      }
    });
  } else {
    // Normal user deletion
    showConfirmDialog(
      'Delete User',
      `Are you sure you want to delete "${userName}"? This action cannot be undone.`,
      () => {
        performUserDeletion(userId, userName, false); // false = not self-deletion
      }
    );
  }
}

async function performUserDeletion(userId, userName, isSelfDeletion) {
  try {
    // Delete the user from Firebase Auth using API (userId is now the UID)
    try {
      await api.deleteUser(userId);
    } catch (error) {
      console.warn('Failed to delete user from Firebase Auth:', error.message);
      // Still show success since Firestore document was deleted
    }

    if (isSelfDeletion) {
      // Self-deletion: show message and log out
      Swal.fire({
        title: 'Account Deleted',
        text: 'Your account has been permanently deleted. You will now be logged out.',
        icon: 'info',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
      }).then(() => {
        // Log out the user
        auth.signOut();
      });
    } else {
      // Normal deletion: show success and reload
      Swal.fire(
        'Deleted!',
        'User has been deleted from the system.',
        'success'
      );
      loadUsers();
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    Swal.fire('Error!', 'Failed to delete user.', 'error');
  }
}

// Dashboard
function loadDashboard() {
  // Show/hide tiles based on user role
  if (currentUser.isAdmin) {
    // Global admins can see all tiles
    totalClientsTile.classList.remove('hidden');
    currentClientTile.classList.remove('hidden');
  } else {
    // Client admins cannot see client-related tiles
    totalClientsTile.classList.add('hidden');
    currentClientTile.classList.add('hidden');
  }

  // Load statistics
  loadUserCount()
    .then((userCount) => {
      totalUsers.textContent = userCount;
    })
    .catch((error) => {
      console.error('Error loading user count:', error);
      totalUsers.textContent = '-';
    });

  // Load client stats for global admins
  if (currentUser.isAdmin) {
    db.collection('clients')
      .get()
      .then((clientsSnapshot) => {
        totalClients.textContent = clientsSnapshot.size;

        if (currentClient) {
          const client = clients.find((c) => c.id === currentClient);
          currentClientDisplay.textContent = client
            ? client.Name
            : 'Selected Client';
        } else {
          currentClientDisplay.textContent = 'All Clients';
        }
      })
      .catch((error) => {
        console.error('Error loading client stats:', error);
      });
  }
}

// Load user count based on current context
async function loadUserCount() {
  let query = db.collection('users').where('isAdmin', '==', false);

  if (currentUser.isAdmin) {
    // Global admin: count users for selected client or all clients
    if (currentClient) {
      query = query.where('clientId', '==', currentClient);
    }
    // If no client selected, count all non-admin users
  } else {
    // Client admin: count users for their client only
    query = query.where('clientId', '==', currentUser.clientId);
  }

  const snapshot = await query.get();
  return snapshot.size;
}

// Settings Management
function loadSettings() {
  if (!currentUser.isAdmin) return;

  db.collection('users')
    .where('isAdmin', '==', true)
    .orderBy('createdAt', 'desc')
    .get()
    .then((snapshot) => {
      const admins = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      renderAdminsTable(admins);
    })
    .catch((error) => {
      console.error('Error loading admins:', error);
    });
}

function renderAdminsTable(admins) {
  adminsTableBody.innerHTML = '';

  admins.forEach((admin) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900">
          ${admin.firstName} ${admin.lastName}
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${admin.email}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${formatDate(admin.createdAt)}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button class="delete-admin-btn text-red-600 hover:text-red-900">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;

    // Add event listener to the delete button
    const deleteBtn = row.querySelector('.delete-admin-btn');
    deleteBtn.addEventListener('click', () => {
      deleteAdmin(admin.id, `${admin.firstName} ${admin.lastName}`);
    });

    adminsTableBody.appendChild(row);
  });
}

function createAdmin(adminData) {
  // Use the UID as the document ID
  return db.collection('users').doc(adminData.uid).set({
    firstName: adminData.firstName,
    lastName: adminData.lastName,
    email: adminData.email,
    uid: adminData.uid,
    isAdmin: true,
    isClientAdmin: false,
    clientId: null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

function deleteAdmin(adminId, adminName) {
  // Check if admin is trying to delete themselves
  if (adminId === currentUser.docId) {
    Swal.fire({
      title: '⚠️ Delete Your Own Admin Account?',
      html: `
        <div class="text-left">
          <p class="mb-3">You are about to delete your own admin account!</p>
          <div class="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
            <div class="flex">
              <div class="flex-shrink-0">
                <i class="fas fa-exclamation-triangle text-red-400"></i>
              </div>
              <div class="ml-3 text-sm text-red-700">
                <strong>Warning:</strong> This will immediately log you out and permanently delete your admin account. You won't be able to access the system anymore.
              </div>
            </div>
          </div>
          <p class="text-sm text-gray-600">Are you absolutely sure you want to proceed?</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete My Admin Account',
      cancelButtonText: 'Cancel',
      focusCancel: true,
    }).then((result) => {
      if (result.isConfirmed) {
        performAdminDeletion(adminId, adminName, true); // true = self-deletion
      }
    });
  } else {
    // Normal admin deletion
    showConfirmDialog(
      'Delete Global Admin',
      `Are you sure you want to delete "${adminName}"? This action cannot be undone.`,
      () => {
        performAdminDeletion(adminId, adminName, false); // false = not self-deletion
      }
    );
  }
}

async function performAdminDeletion(adminId, adminName, isSelfDeletion) {
  try {
    // Call API to delete user (handles both Firebase Auth and Firestore)
    await api.deleteUser(adminId);

    // Success handling
    if (isSelfDeletion) {
      // Self-deletion: show message and log out
      Swal.fire({
        title: 'Admin Account Deleted',
        text: 'Your admin account has been permanently deleted. You will now be logged out.',
        icon: 'info',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
      }).then(() => {
        // Log out the user
        auth.signOut();
      });
    } else {
      // Normal deletion: show success and reload
      Swal.fire('Deleted!', 'Global Admin has been deleted.', 'success');
      loadSettings();
    }
  } catch (error) {
    console.error('Error deleting admin:', error);
    Swal.fire(
      'Error!',
      `Failed to delete Global Admin: ${error.message}`,
      'error'
    );
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async function () {
  try {
    // Initialize Firebase first
    const firebaseInstances = await initializeFirebase();
    auth = firebaseInstances.auth;
    db = firebaseInstances.db;

    // Listen for auth state changes
    auth.onAuthStateChanged(handleAuthStateChanged);
  } catch (error) {
    showError('Failed to initialize Firebase. Please check your connection.');
    return; // Stop if Firebase failed to initialize
  }

  // Login form
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    showLoginLoading();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
      hideLoginLoading();
      console.error('Login error:', error);
      showError('Invalid email or password.');
    }
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    auth.signOut();
  });

  // Navigation
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = e.target.closest('a').getAttribute('href').substring(1);
      navigateTo(page);
    });
  });

  // Client selector
  clientSelect.addEventListener('change', (e) => {
    currentClient = e.target.value;
    // Always reload users when client changes (for both Global and Client Admins)
    loadUsers();
    // Also reload dashboard to update current client display
    if (currentUser.isAdmin) {
      loadDashboard();
    }
  });

  // Create user modal
  createUserBtn.addEventListener('click', () => {
    showModal('createUserModal');
  });

  cancelCreateUser.addEventListener('click', () => {
    hideModal('createUserModal');
    createUserForm.reset();
  });

  createUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(createUserForm);
    const userData = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      isClientAdmin: formData.get('isClientAdmin') === 'on',
    };

    try {
      await createUser(userData);
      hideModal('createUserModal');
      createUserForm.reset();
      loadUsers();
      Swal.fire('Success!', 'User created successfully.', 'success');
    } catch (error) {
      console.error('Error creating user:', error);
      Swal.fire('Error!', 'Failed to create user.', 'error');
    }
  });

  // Create client modal
  createClientBtn.addEventListener('click', () => {
    showModal('createClientModal');
  });

  cancelCreateClient.addEventListener('click', () => {
    hideModal('createClientModal');
    createClientForm.reset();
  });

  createClientForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(createClientForm);
    const clientData = {
      name: formData.get('name'),
    };

    try {
      await createClient(clientData);
      hideModal('createClientModal');
      createClientForm.reset();
      loadClients();
      Swal.fire('Success!', 'Client created successfully.', 'success');
    } catch (error) {
      console.error('Error creating client:', error);
      Swal.fire('Error!', 'Failed to create client.', 'error');
    }
  });

  // Create admin modal
  createAdminBtn.addEventListener('click', () => {
    showModal('createAdminModal');
  });

  cancelCreateAdmin.addEventListener('click', () => {
    hideModal('createAdminModal');
    createAdminForm.reset();
  });

  generateAdminPasswordBtn.addEventListener('click', () => {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('adminPassword').value = password;
  });

  createAdminForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(createAdminForm);
    const adminData = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      password: formData.get('password'),
    };

    try {
      // Create user using server-side API (Admin SDK)
      const result = await api.createUser({
        email: adminData.email,
        password: adminData.password,
        displayName: `${adminData.firstName} ${adminData.lastName}`,
      });

      // Create admin document in Firestore
      await createAdmin({
        ...adminData,
        uid: result.uid,
      });

      hideModal('createAdminModal');
      createAdminForm.reset();
      loadSettings();
      Swal.fire('Success!', 'Global Admin created successfully.', 'success');
    } catch (error) {
      console.error('Error creating admin:', error);
      Swal.fire('Error!', 'Failed to create Global Admin.', 'error');
    }
  });

  // Initialize app
  showLoading();
});
