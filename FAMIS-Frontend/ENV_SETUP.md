# Environment Setup Guide

## Create .env file

Create a `.env` file in the root directory with the following variables:

```env
# OAuth2 Configuration
VITE_AUTH_URL=https://your-oauth-provider.com/oauth/authorize
VITE_TOKEN_URL=https://your-oauth-provider.com/oauth/token
VITE_APP_ID=your_client_id_here
VITE_CALLBACK_URL=http://localhost:5173/callback
VITE_SCOPE=openid profile email
```

## Example for CMU SSO

```env
VITE_AUTH_URL=https://sso.cmu.ac.th/oauth/authorize
VITE_TOKEN_URL=https://sso.cmu.ac.th/oauth/token
VITE_APP_ID=your_cmu_client_id
VITE_CALLBACK_URL=http://localhost:5173/callback
VITE_SCOPE=openid profile email
```

## How to get OAuth2 credentials

1. Contact your OAuth2 provider (e.g., CMU IT)
2. Register your application
3. Get Client ID and Client Secret
4. Set the redirect URI to: `http://localhost:5173/callback`

## Security Notes

- Never commit `.env` file to version control
- Use HTTPS in production
- Keep your client secret secure 