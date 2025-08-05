# BestDoc Backend API

Express.js-based Netlify Functions for the BestDoc back office application.

## Environment Variables

The API requires the following environment variables to be set:

## Setup

1. Copy `env.example` to `.env`:

   ```bash
   cp env.example .env
   ```

2. Fill in your actual Firebase project values in the `.env` file.

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npx netlify dev --port 8888
   ```

## API Endpoints

### GET /api/health

Health check endpoint.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "function": "api",
  "environment": "development"
}
```

### GET /api/firebase-config

Get Firebase configuration for frontend initialization.

**Response:**

```json
{
  "success": true,
  "config": {
    "apiKey": "...",
    "authDomain": "...",
    "projectId": "...",
    "storageBucket": "...",
    "messagingSenderId": "...",
    "appId": "..."
  }
}
```

### POST /api/users

Create a new user in Firebase Auth (Admin only).

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "displayName": "User Name"
}
```

**Response:**

```json
{
  "success": true,
  "uid": "firebase_user_uid",
  "message": "User created in Firebase Auth"
}
```

### DELETE /api/users/:uid

Delete a user from Firebase Auth (Admin only).

**Response:**

```json
{
  "success": true,
  "message": "User deleted from Firebase Auth"
}
```

### POST /api/users/send-password-setup

Send password setup email to a user.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password setup email sent"
}
```

## Deployment

For production deployment on Netlify:

1. Set the environment variables in your Netlify site settings
2. Deploy the `backoffice` folder
3. The functions will be automatically deployed to `/.netlify/functions/api`

## Testing

Use the `config-test.html` file to test the Firebase config endpoint:

1. Open `config-test.html` in your browser
2. Click "Get Firebase Config"
3. Verify the response contains your Firebase configuration
