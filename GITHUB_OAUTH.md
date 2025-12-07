# GitHub App OAuth Configuration

This guide explains how to configure GitHub App authentication for Thoughts & Time.

## Why GitHub App (not OAuth App)?

- **Token refresh**: GitHub Apps issue expiring tokens (8 hours) with refresh tokens (6 months)
- **Fine-grained permissions**: Better control over repository and API access
- **Future Gist integration**: Required for exporting tasks/notes to GitHub Gists

## Setup Steps

### 1. Create a GitHub App

1. Go to **GitHub Settings** → **Developer settings** → **GitHub Apps**
2. Click **New GitHub App**
3. Fill in the required fields:

| Field | Value |
|-------|-------|
| **GitHub App name** | `Thoughts and Time` (or your preferred name) |
| **Homepage URL** | `http://localhost:5173` (dev) or your production URL |
| **Callback URL** | `http://localhost:5173/auth/github/callback` |
| **Request user authorization (OAuth) during installation** | ✅ Checked |
| **Webhook** | ❌ Uncheck "Active" (not needed) |

### 2. Configure Permissions

Under **Permissions & events** → **Account permissions**:

| Permission | Access |
|------------|--------|
| **Email addresses** | Read-only |
| **Gists** | Read and write *(for future Gist export)* |

### 3. Generate Client Secret

1. After creating the app, scroll to **Client secrets**
2. Click **Generate a new client secret**
3. Copy and save the secret immediately (shown only once)

### 4. Get Client ID

Copy the **Client ID** from the app's settings page (shown at the top).

### 5. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# GitHub App OAuth
VITE_GITHUB_CLIENT_ID=your_client_id_here

# Production only: Backend endpoint for token exchange
# VITE_GITHUB_TOKEN_ENDPOINT=https://your-backend.com/api/auth/github/token
# VITE_GITHUB_REFRESH_ENDPOINT=https://your-backend.com/api/auth/github/refresh
```

## Production Considerations

### Backend Proxy Required

GitHub's token exchange endpoint requires the **client secret**, which cannot be exposed in frontend code. For production, you need a backend proxy:

```
POST /api/auth/github/token
Body: { code, redirect_uri }
Returns: { access_token, refresh_token, expires_in, ... }

POST /api/auth/github/refresh
Body: { refresh_token, grant_type: "refresh_token" }
Returns: { access_token, refresh_token, expires_in, ... }
```

### Multiple Callback URLs

For different environments, add multiple callback URLs in GitHub App settings:
- `http://localhost:5173/auth/github/callback` (development)
- `https://your-app.com/auth/github/callback` (production)

## Token Lifecycle

| Token Type | Duration | Usage |
|------------|----------|-------|
| Access Token | 8 hours | API requests |
| Refresh Token | 6 months | Get new access tokens |

The app automatically tracks token expiration via `hasValidGithubToken` in the user profile.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "GitHub App not configured" | Set `VITE_GITHUB_CLIENT_ID` in `.env.local` |
| "Token exchange failed" | Configure backend proxy or check client secret |
| Callback URL mismatch | Ensure URL in GitHub App matches `redirectUri` |

## References

- [GitHub Apps documentation](https://docs.github.com/en/apps/creating-github-apps)
- [User authorization for GitHub Apps](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app)
- [Refreshing user access tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/refreshing-user-access-tokens)
