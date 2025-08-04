# BestDoc - Multi-Tenant Back Office System

A complete multi-tenant authentication and presentation management system with client-based access control, built with Firebase, PHP, and Netlify Functions.

## 🎯 Overview

BestDoc provides a secure back office system where:

- **Global Admins** manage the entire system and all clients
- **Client Admins** manage users within their assigned client
- **Users** access client-specific presentations
- **Presentations** are protected by client ID-based authentication

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Back Office   │    │     Backend     │    │  Presentations  │
│   (Frontend)    │────│  (Netlify Fn)   │    │     (PHP)       │
│                 │    │                 │    │                 │
│ • User Mgmt     │    │ • Firebase SDK  │    │ • Auth Guard    │
│ • Client Mgmt   │    │ • User Creation │    │ • Client Check  │
│ • Role Mgmt     │    │ • Email Setup   │    │ • Content Serve │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │    Firebase     │
                    │                 │
                    │ • Authentication│
                    │ • Firestore DB  │
                    │ • Email Service │
                    └─────────────────┘
```

## 🚀 Quick Start

### 1. **Setup Firebase**

```bash
# Create Firebase project at https://console.firebase.google.com
# Enable Authentication (Email/Password)
# Create Firestore database
# Get project credentials
```

### 2. **Deploy Backend**

```bash
cd backoffice/backend
cp env.example .env
# Add your Firebase credentials to .env
netlify deploy --functions
```

### 3. **Setup Back Office**

```bash
cd backoffice
# Deploy to your hosting (Netlify, Vercel, etc.)
# Visit /setup.html to create first global admin
```

### 4. **Configure Presentations**

```bash
# Copy auth/ folder to your PHP server
# Include auth guard in your presentations
```

## 👥 User Roles

### 🔑 **Global Admin**

- **Full System Access**: Manage all clients, users, and settings
- **User Management**: Create/delete any user across all clients
- **Client Management**: Create/delete clients and assign admins
- **Settings Access**: Global configuration and admin management
- **Client Context**: Can switch between clients to manage users

### 🏢 **Client Admin**

- **Client-Specific Access**: Manage users within assigned client only
- **User Management**: Create/delete users for their client
- **Limited Dashboard**: See stats for their client only
- **No Settings**: Cannot access global admin settings

### 👤 **User**

- **Presentation Access**: View client-specific presentations
- **No Back Office**: Cannot access admin interface
- **Client-Restricted**: Only see content for their assigned client

## 🔧 System Components

### 📊 **Back Office** (`/backoffice/`)

The main admin interface built with vanilla JavaScript and Firebase SDK.

**Features:**

- User creation with automatic email setup
- Client management with ID generation
- Role-based dashboard and navigation
- Client context switching for global admins
- Settings page for global admin management

**Setup:**

1. Deploy to static hosting (Netlify, Vercel, etc.)
2. Visit `/setup.html` to create first global admin
3. Use back office to manage clients and users

### ⚡ **Backend** (`/backoffice/backend/`)

Netlify Functions providing secure server-side operations using Firebase Admin SDK.

**API Endpoints:**

- `GET /api/health` - Health check
- `GET /api/firebase-config` - Frontend configuration
- `POST /api/users` - Create user with email setup
- `DELETE /api/users/:uid` - Delete user
- `POST /api/users/send-password-setup` - Resend setup email

**Setup:**

1. Copy `env.example` to `.env`
2. Add Firebase credentials and Admin SDK key
3. Deploy with `netlify deploy --functions`

### 📧 **Password Setup Flow**

Users receive email links to set their password instead of getting passwords directly.

**Process:**

1. Admin creates user (email only, no password)
2. Firebase sends password setup email automatically
3. User clicks link → `/setup-password.html`
4. User sets password and gets redirected to appropriate interface

### 🔒 **Presentation Protection** (`/auth/`)

PHP authentication system that protects presentations with client-based access control.

**How it Works:**

```php
<?php
// In your presentation (e.g., client-specific.php)
require_once '../auth/auth-guard.php';

// Define required client ID for this presentation
requireAuth('client-123');

// Your presentation content here
echo file_get_contents('presentation.html');
?>
```

**Features:**

- Client ID validation for each presentation
- Firebase token verification
- Firestore user data validation
- Session management
- Automatic login redirects

## 🗄️ Database Structure

### Firestore Collections

**`users`** collection:

```javascript
{
  uid: "firebase-auth-uid",           // Document ID matches Firebase Auth UID
  email: "user@example.com",
  clientId: "client-123",             // Which client they belong to
  isAdmin: false,                     // Global admin flag
  isClientAdmin: false,               // Client admin flag
  createdAt: "2024-01-01T00:00:00Z"
}
```

**`clients`** collection:

```javascript
{
  id: "client-123",                   // Document ID
  name: "Acme Corporation",
  createdAt: "2024-01-01T00:00:00Z",
  adminId: "admin-uid"                // Client admin's UID
}
```

## 🛡️ Security Features

### 🔐 **Authentication**

- Firebase Authentication for secure login
- ID token validation for API calls
- Session-based PHP authentication
- Automatic token refresh

### 🎯 **Authorization**

- Role-based access control (Global Admin, Client Admin, User)
- Client-based content restriction
- Firestore security rules
- Backend middleware validation

### 🔒 **Access Control**

- Each presentation defines required client ID
- Users can only access content for their assigned client
- Admins can switch client context
- API endpoints require admin privileges

## 🎯 Testing

Use the demo environment to test the complete authentication flow:

```bash
cd backoffice/demo
docker-compose up -d

# Test at http://localhost:9090/
# Create user with clientId: "demo-client-123"
```
