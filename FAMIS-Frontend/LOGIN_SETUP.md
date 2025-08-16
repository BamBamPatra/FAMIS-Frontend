# OAuth2 Login Setup Guide

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# OAuth2 Configuration
VITE_AUTH_URL=https://your-oauth-provider.com/oauth/authorize
VITE_TOKEN_URL=https://your-oauth-provider.com/oauth/token
VITE_APP_ID=your_client_id_here
VITE_CALLBACK_URL=http://localhost:5173/callback
VITE_SCOPE=openid profile email
```

## Features

### LoginView.vue
- Beautiful login page with CMU branding
- OAuth2 PKCE flow implementation
- Loading states and error handling
- Responsive design

### CallbackView.vue
- Handles OAuth2 callback
- Token exchange with PKCE
- Error handling and retry functionality
- Automatic redirect to main app

### AuthStore
- Manages authentication state
- Stores access tokens securely
- User information management
- Logout functionality

## Usage

1. **Login Flow**: User clicks "Sign in with CMU Account" → Redirected to OAuth provider → Returns to callback → Token exchange → Redirected to main app

2. **Authentication Check**: App checks for valid access token on load

3. **Logout**: User clicks logout button → Clears all auth data → Redirects to login

## Routes

- `/login` - Login page
- `/callback` - OAuth2 callback handler
- `/` - Main application (protected)

## Dependencies

The following packages are required:
- `randomstring` - For PKCE code verifier generation
- `crypto-js` - For PKCE code challenge generation
- `@types/randomstring` - TypeScript types
- `@types/crypto-js` - TypeScript types

## Security Features

- PKCE (Proof Key for Code Exchange) implementation
- Secure token storage in sessionStorage
- Automatic token validation
- CSRF protection through PKCE 