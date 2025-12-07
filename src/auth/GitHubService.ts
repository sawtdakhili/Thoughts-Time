/**
 * GitHub Service for Thoughts & Time.
 *
 * Handles GitHub App OAuth authentication and provides a foundation
 * for GitHub API interactions (Gists, etc.) to be added later.
 *
 * Architecture:
 * - Uses GitHub App user authorization flow (not OAuth App)
 * - Supports token refresh for long-lived sessions
 * - Designed for easy extension with Gist API methods
 *
 * Note: Token exchange requires a backend proxy since GitHub requires
 * the client_secret which cannot be exposed in frontend code.
 * For development, we provide mock implementations.
 */

import {
  GitHubAppConfig,
  GitHubUser,
  GitHubTokenResponse,
  GitHubCredentials,
} from './types';

/**
 * GitHub App configuration.
 * In production, set VITE_GITHUB_CLIENT_ID in your environment.
 */
const GITHUB_CONFIG: GitHubAppConfig = {
  clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
  redirectUri: `${window.location.origin}/auth/github/callback`,
  // Scopes for GitHub App - 'gist' will be needed for future Gist integration
  // GitHub Apps define max scopes at app level; we request what we need
  scope: 'read:user user:email gist',
};

/** GitHub API base URL */
const GITHUB_API_URL = 'https://api.github.com';

/** GitHub OAuth URLs */
const GITHUB_OAUTH = {
  authorize: 'https://github.com/login/oauth/authorize',
  // Note: access_token endpoint requires client_secret, must go through backend
  accessToken: 'https://github.com/login/oauth/access_token',
};

/** Session storage key for OAuth state (CSRF protection) */
const OAUTH_STATE_KEY = 'github_oauth_state';

/**
 * GitHub Service class.
 * Handles OAuth flow and provides methods for GitHub API interactions.
 */
class GitHubService {
  private config: GitHubAppConfig;

  constructor(config: GitHubAppConfig = GITHUB_CONFIG) {
    this.config = config;
  }

  /**
   * Check if GitHub integration is configured.
   */
  isConfigured(): boolean {
    return !!this.config.clientId;
  }

  /**
   * Get the GitHub App Client ID.
   */
  getClientId(): string {
    return this.config.clientId;
  }

  /**
   * Generate OAuth state for CSRF protection.
   */
  private generateState(): string {
    const state = crypto.randomUUID();
    sessionStorage.setItem(OAUTH_STATE_KEY, state);
    return state;
  }

  /**
   * Validate OAuth state from callback.
   */
  validateState(state: string): boolean {
    const stored = sessionStorage.getItem(OAUTH_STATE_KEY);
    sessionStorage.removeItem(OAUTH_STATE_KEY);
    return stored === state;
  }

  /**
   * Get the authorization URL for GitHub App OAuth.
   * Redirects user to GitHub to authorize the app.
   */
  getAuthorizationUrl(): string {
    if (!this.isConfigured()) {
      throw new Error('GitHub App not configured. Set VITE_GITHUB_CLIENT_ID.');
    }

    const state = this.generateState();

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope,
      state,
      // GitHub Apps support additional parameters
      allow_signup: 'true',
    });

    return `${GITHUB_OAUTH.authorize}?${params}`;
  }

  /**
   * Initiate GitHub OAuth flow.
   * Redirects the browser to GitHub authorization page.
   */
  initiateOAuth(): void {
    window.location.href = this.getAuthorizationUrl();
  }

  /**
   * Exchange authorization code for access token.
   *
   * IMPORTANT: This requires a backend proxy in production because
   * GitHub's token endpoint requires the client_secret.
   *
   * For development/demo, this returns mock data.
   * In production, implement: POST /api/auth/github/token { code }
   *
   * @param code - Authorization code from GitHub callback
   * @returns Token response with access_token and optional refresh_token
   */
  async exchangeCodeForToken(code: string): Promise<GitHubTokenResponse> {
    // Check if we have a backend endpoint configured
    const backendUrl = import.meta.env.VITE_GITHUB_TOKEN_ENDPOINT;

    if (backendUrl) {
      // Production: Use backend proxy
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          redirect_uri: this.config.redirectUri,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Token exchange failed' }));
        throw new Error(error.message || 'Failed to exchange code for token');
      }

      return response.json();
    }

    // Development: Mock token response
    // In a real app, you'd need a backend to handle this
    console.warn(
      'GitHub token exchange: No backend configured (VITE_GITHUB_TOKEN_ENDPOINT). ' +
      'Using mock data for development. Set up a backend proxy for production.'
    );

    // Simulate token response structure for development
    return {
      access_token: `mock_token_${Date.now()}`,
      token_type: 'bearer',
      scope: this.config.scope,
      // GitHub Apps issue expiring tokens (8 hours)
      expires_in: 28800,
      refresh_token: `mock_refresh_${Date.now()}`,
      // Refresh tokens last 6 months
      refresh_token_expires_in: 15768000,
    };
  }

  /**
   * Refresh an access token using a refresh token.
   *
   * GitHub Apps issue tokens that expire after 8 hours.
   * Use this to get a new access token without user interaction.
   *
   * @param refreshToken - The refresh token from previous auth
   * @returns New token response
   */
  async refreshAccessToken(refreshToken: string): Promise<GitHubTokenResponse> {
    const backendUrl = import.meta.env.VITE_GITHUB_REFRESH_ENDPOINT;

    if (backendUrl) {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Token refresh failed' }));
        throw new Error(error.message || 'Failed to refresh token');
      }

      return response.json();
    }

    // Development mock
    console.warn('GitHub token refresh: Using mock data for development.');
    return {
      access_token: `mock_refreshed_token_${Date.now()}`,
      token_type: 'bearer',
      scope: this.config.scope,
      expires_in: 28800,
      refresh_token: refreshToken,
      refresh_token_expires_in: 15768000,
    };
  }

  /**
   * Fetch the authenticated user's GitHub profile.
   *
   * @param accessToken - Valid GitHub access token
   * @returns GitHub user profile
   */
  async getUser(accessToken: string): Promise<GitHubUser> {
    const response = await fetch(`${GITHUB_API_URL}/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch user' }));
      throw new Error(error.message || 'Failed to fetch GitHub user');
    }

    return response.json();
  }

  /**
   * Fetch the authenticated user's email addresses.
   * Uses the user:email scope to get private emails.
   *
   * @param accessToken - Valid GitHub access token
   * @returns Primary email address or null
   */
  async getUserEmail(accessToken: string): Promise<string | null> {
    try {
      const response = await fetch(`${GITHUB_API_URL}/user/emails`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (!response.ok) {
        return null;
      }

      const emails = await response.json() as Array<{
        email: string;
        primary: boolean;
        verified: boolean;
      }>;

      // Find primary verified email
      const primary = emails.find((e) => e.primary && e.verified);
      return primary?.email || emails[0]?.email || null;
    } catch {
      return null;
    }
  }

  /**
   * Check if an access token is still valid.
   *
   * @param accessToken - Token to check
   * @returns True if token is valid
   */
  async isTokenValid(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${GITHUB_API_URL}/user`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Calculate token expiration date from expires_in seconds.
   */
  calculateExpiresAt(expiresIn: number): string {
    return new Date(Date.now() + expiresIn * 1000).toISOString();
  }

  /**
   * Check if a token expiration date has passed.
   */
  isExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return true;
    return new Date(expiresAt) <= new Date();
  }

  /**
   * Create GitHubCredentials from token response and user info.
   */
  createCredentials(
    tokenResponse: GitHubTokenResponse,
    user: GitHubUser
  ): GitHubCredentials {
    return {
      accessToken: tokenResponse.access_token,
      tokenExpiresAt: tokenResponse.expires_in
        ? this.calculateExpiresAt(tokenResponse.expires_in)
        : new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // Default 8 hours
      refreshToken: tokenResponse.refresh_token || null,
      refreshTokenExpiresAt: tokenResponse.refresh_token_expires_in
        ? this.calculateExpiresAt(tokenResponse.refresh_token_expires_in)
        : null,
      githubId: String(user.id),
      githubUsername: user.login,
    };
  }

  // ============================================================
  // Future Gist API methods (stubs for extension)
  // ============================================================

  /**
   * List user's gists.
   * TODO: Implement when Gist integration is added.
   */
  // async listGists(accessToken: string): Promise<Gist[]> { }

  /**
   * Create a new gist.
   * TODO: Implement when Gist integration is added.
   */
  // async createGist(accessToken: string, data: CreateGistData): Promise<Gist> { }

  /**
   * Update an existing gist.
   * TODO: Implement when Gist integration is added.
   */
  // async updateGist(accessToken: string, gistId: string, data: UpdateGistData): Promise<Gist> { }
}

// Singleton instance
let githubServiceInstance: GitHubService | null = null;

/**
 * Get the GitHub service singleton.
 */
export function getGitHubService(): GitHubService {
  if (!githubServiceInstance) {
    githubServiceInstance = new GitHubService();
  }
  return githubServiceInstance;
}

export { GitHubService, GITHUB_CONFIG };
