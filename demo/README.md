# BestDoc Demo Environment

This demo environment tests the complete E2E authentication flow for client-restricted presentations using PHP authentication guards.

## 🚀 Quick Start

```bash
cd backoffice/demo
docker-compose up -d
```

## 🎯 Test URLs

- **Main Demo**: http://localhost:9090/
- **Other Page**: http://localhost:9090/other-page.html
- **Login**: http://localhost:9090/../login.php
- **Back Office**: http://localhost:9090/../backoffice/

## 🔧 What This Tests

### ✅ Authentication System

- **PHP Auth Guard**: Client-based access control with mandatory `clientId`
- **Firebase Integration**: Token validation and Firestore user verification
- **Multi-client Support**: Each presentation requires specific client access
- **Session Management**: Secure PHP session handling

### 📁 File Structure

- **`index.php`**: Auth guard + `requireAuth('demo-client-123')` + `file_get_contents('index.html')`
- **`index.html`**: Demo presentation content with navigation
- **`other-page.html`**: Secondary page to test routing
- **`.htaccess`**: Routes `*.html` files through `index.php?file=filename`

### 🔄 Authentication Flow

1. **Access Request**: User tries to access `index.php` or `other-page.html`
2. **Auth Check**: PHP guard validates Firebase session and client access
3. **Redirect**: Unauthenticated users sent to login with `client_id` parameter
4. **Login Process**: User authenticates via Firebase and Firestore validation
5. **Content Delivery**: Authenticated users see HTML content via `file_get_contents()`

### 📋 Test Scenarios

#### ✅ **Should Work**

- **Direct index.php access**: With valid `demo-client-123` user
- **other-page.html access**: Routes through auth system automatically
- **Back office access**: Admin users can manage the demo client
- **Navigation**: Links between pages maintain authentication

#### ❌ **Should Fail**

- **Wrong client users**: Users from different clients denied access
- **Unauthenticated users**: Redirect to login page
- **Missing Firestore record**: Firebase Auth user without Firestore data
- **Non-admin operations**: Regular users can't access admin functions

### 🎯 **Demo Client Setup**

- **Client ID**: `demo-client-123`
- **Purpose**: Testing client-restricted presentations
- **Users**: Create test users in back office with this client ID
- **Access**: Only users assigned to `demo-client-123` can view content

## 🐳 Docker Status

Check if running:

```bash
docker-compose ps
```

View logs:

```bash
docker-compose logs web
```

Stop:

```bash
docker-compose down
```

## 🎉 Success Indicators

### ✅ **System Working Properly**

- **Port 9090**: Accessible and responding
- **Authentication Flow**: Unauthenticated users redirect to login
- **Client Validation**: Only `demo-client-123` users can access content
- **Content Serving**: HTML files served via `file_get_contents()` with auth
- **Routing**: `.htaccess` properly routes `.html` files through `index.php`
- **No PHP Errors**: Check logs with `docker-compose logs web`

### 🔍 **Testing Checklist**

1. **Create Demo User**:

   - Go to back office → Create user with `clientId: demo-client-123`
   - Test login works for this user

2. **Test Access Control**:

   - ✅ Demo user can access http://localhost:9090/
   - ✅ Demo user can access http://localhost:9090/other-page.html
   - ❌ Users from other clients should be denied

3. **Test Unauthenticated Access**:

   - ❌ Should redirect to login page
   - ✅ After login, should return to requested page

4. **Test Navigation**:
   - ✅ Links between pages work without re-authentication
   - ✅ Logout works and clears session

### 🚨 **Troubleshooting**

If issues occur, check:

- **Docker**: `docker-compose ps` shows container running
- **Logs**: `docker-compose logs web` for PHP errors
- **File Permissions**: Ensure files are readable by Apache
- **Firebase Config**: Auth configuration is properly set up
- **Client ID**: `demo-client-123` client exists in Firestore
