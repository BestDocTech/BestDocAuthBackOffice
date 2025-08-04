# BestDoc Back Office

A multi-tenant back office application for managing clients and users with Firebase authentication and Firestore database.

## Features

### Authentication

- Firebase Authentication for secure login
- Role-based access control (Global Admin vs Client Admin)
- Session management

### User Management

- Create new users with custom passwords
- View all users for the current client (Client Admins) or all users (Global Admins)
- Delete users with confirmation
- Generate secure passwords automatically
- Assign client admin privileges

### Client Management (Global Admins only)

- Create new clients
- View all clients in a table
- Delete clients (with cascade deletion of associated users)
- Client statistics

### Dashboard

- Overview statistics (total users, total clients, current client)
- Quick navigation to all features

## Setup Instructions

### 1. Firebase Configuration

The application is already configured with your Firebase project. The configuration is in `js/app.js`:

### 2. Firestore Database Structure

The application uses two collections:

#### clients Collection

```
{
  Name: string,
  createdAt: timestamp
}
```

#### users Collection

```
{
  firstName: string,
  lastName: string,
  email: string,
  uid: string (Firebase Auth UID),
  clientId: string|null (reference to client, null for global admins),
  isAdmin: boolean (global admin),
  isClientAdmin: boolean (client admin),
  createdAt: timestamp
}
```

### 3. Initial Setup

1. **Create the first Global Admin user:**

   - Go to your Firebase Console
   - Navigate to Authentication > Users
   - Create a new user with email and password
   - Go to Firestore Database
   - Create a new document in the `Users` collection with:
     ```json
     {
       "firstName": "Admin",
       "lastName": "User",
       "email": "admin@example.com",
       "isAdmin": true,
       "isClientAdmin": false,
       "createdAt": [server timestamp]
     }
     ```

2. **Create your first client:**

   - Log into the back office with your admin account
   - Navigate to Clients page
   - Click "Create Client" and add your first client

3. **Create client users:**
   - Navigate to Users page
   - Click "Create User" to add users for your client
   - Set `isClientAdmin: true` for users who should manage their client's users

## Usage Guide

### Global Admins

- Can access all features
- Can create and manage all clients
- Can create users for any client
- Can view all users across all clients
- Can delete clients (which also deletes all associated users)

### Client Admins

- Can only manage users for their assigned client
- Cannot access the Clients page
- Can create and delete users for their client
- Can assign other users as client admins for their client

### User Roles

- **Global Admin**: Full access to all features
- **Client Admin**: Can manage users for their specific client
- **Regular User**: Can only view their own information (not implemented in this version)

## File Structure

```
backoffice/
├── index.html          # Main application file
├── js/
│   └── app.js         # Application logic
└── README.md          # This file
```

## Security Features

- Firebase Authentication for secure login
- Role-based access control
- Client isolation (Client Admins can only see their client's data)
- Confirmation dialogs for destructive actions
- Input validation and sanitization

## Dependencies

The application uses CDN-hosted dependencies:

- **Tailwind CSS**: For styling
- **Firebase SDK**: For authentication and database
- **SweetAlert2**: For confirmation dialogs
- **Font Awesome**: For icons

## Browser Compatibility

- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge
- Mobile responsive design

## Troubleshooting

### Common Issues

1. **"User not authorized" error:**

   - Ensure the user exists in the Firestore `Users` collection
   - Check that the email matches exactly

2. **Cannot create users:**

   - Ensure you have the correct permissions (Global Admin or Client Admin)
   - Check that you've selected a client (for Global Admins)

3. **Cannot see clients page:**
   - Only Global Admins can access the Clients page
   - Client Admins cannot manage clients

### Firebase Rules

Make sure your Firestore security rules allow read/write access for authenticated users:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Development

To modify the application:

1. Edit `index.html` for UI changes
2. Edit `js/app.js` for functionality changes
3. Test thoroughly with different user roles
4. Update this README if needed

## Support

For issues or questions:

1. Check the browser console for error messages
2. Verify Firebase configuration
3. Ensure proper user permissions in Firestore

https://bestdoc-dev-85e9a.firebaseapp.com/__/auth/action
