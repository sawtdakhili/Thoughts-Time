/**
 * Authentication Storage Provider using SQLite.
 *
 * Handles user data storage, authentication, and session management
 * using sql.js (SQLite compiled to WebAssembly).
 */

import initSqlJs, { Database } from 'sql.js';
import { User, UserProfile, Session, AuthResult, GitHubCredentials } from './types';
import { hashPassword, verifyPassword, generateId, generateSessionToken } from './crypto';

/** SQL.js WASM URL */
const SQL_WASM_URL = 'https://sql.js.org/dist/sql-wasm.wasm';

/** localStorage key for the auth database */
const AUTH_DB_KEY = 'thoughts-time-auth-db';

/** localStorage key for the current session */
const SESSION_KEY = 'thoughts-time-session';

/** Session expiration time in days */
const SESSION_EXPIRATION_DAYS = 30;

export class AuthStorageProvider {
  private db: Database | null = null;
  private initialized = false;

  /**
   * Initialize the auth storage provider.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const SQL = await initSqlJs({
        locateFile: () => SQL_WASM_URL,
      });

      // Try to load existing database
      const stored = localStorage.getItem(AUTH_DB_KEY);
      if (stored) {
        try {
          const binaryData = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
          this.db = new SQL.Database(binaryData);
        } catch {
          this.db = new SQL.Database();
          this.createTables();
        }
      } else {
        this.db = new SQL.Database();
        this.createTables();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize auth storage:', error);
      throw error;
    }
  }

  private createTables(): void {
    if (!this.db) return;

    // Users table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        surname TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_login_at TEXT,
        github_id TEXT UNIQUE,
        github_username TEXT,
        github_access_token TEXT,
        github_token_expires_at TEXT,
        github_refresh_token TEXT,
        github_refresh_token_expires_at TEXT
      )
    `);

    // Run migrations for existing databases
    this.runMigrations();

    // Sessions table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Password reset tokens table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at TEXT NOT NULL,
        used_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    this.db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)');

    this.saveToLocalStorage();
  }

  /**
   * Run database migrations for existing databases.
   * Adds new columns for GitHub App token fields.
   */
  private runMigrations(): void {
    if (!this.db) return;

    // Check if new columns exist by querying table info
    const columns = this.db.exec("PRAGMA table_info(users)");
    if (columns.length === 0) return;

    const columnNames = columns[0].values.map((row) => row[1] as string);

    // Add GitHub App token columns if they don't exist
    if (!columnNames.includes('github_token_expires_at')) {
      this.db.run('ALTER TABLE users ADD COLUMN github_token_expires_at TEXT');
    }
    if (!columnNames.includes('github_refresh_token')) {
      this.db.run('ALTER TABLE users ADD COLUMN github_refresh_token TEXT');
    }
    if (!columnNames.includes('github_refresh_token_expires_at')) {
      this.db.run('ALTER TABLE users ADD COLUMN github_refresh_token_expires_at TEXT');
    }
  }

  private saveToLocalStorage(): void {
    if (!this.db) return;

    try {
      const data = this.db.export();
      const base64 = btoa(String.fromCharCode(...data));
      localStorage.setItem(AUTH_DB_KEY, base64);
    } catch (error) {
      console.error('Failed to save auth database:', error);
    }
  }

  /**
   * Check if the provider is initialized.
   */
  isInitialized(): boolean {
    return this.initialized && this.db !== null;
  }

  /**
   * Create a new user account.
   */
  async createUser(
    email: string,
    username: string,
    password: string,
    firstName: string,
    surname: string
  ): Promise<AuthResult> {
    if (!this.db) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      // Check if email already exists
      const existingEmail = this.db.exec(
        'SELECT id FROM users WHERE email = ? LIMIT 1',
        [email.toLowerCase()]
      );
      if (existingEmail.length > 0 && existingEmail[0].values.length > 0) {
        return { success: false, error: 'Email already registered' };
      }

      // Check if username already exists
      const existingUsername = this.db.exec(
        'SELECT id FROM users WHERE username = ? LIMIT 1',
        [username.toLowerCase()]
      );
      if (existingUsername.length > 0 && existingUsername[0].values.length > 0) {
        return { success: false, error: 'Username already taken' };
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const now = new Date().toISOString();
      const userId = generateId();

      this.db.run(
        `INSERT INTO users (id, email, username, first_name, surname, password_hash, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, email.toLowerCase(), username.toLowerCase(), firstName, surname, passwordHash, now, now]
      );

      this.saveToLocalStorage();

      const user = this.getUserById(userId);
      if (!user) {
        return { success: false, error: 'Failed to create user' };
      }

      return { success: true, user: this.toUserProfile(user) };
    } catch (error) {
      console.error('Failed to create user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user',
      };
    }
  }

  /**
   * Authenticate a user with email/username and password.
   */
  async signIn(emailOrUsername: string, password: string): Promise<AuthResult> {
    if (!this.db) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      // Find user by email or username
      const results = this.db.exec(
        `SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1`,
        [emailOrUsername.toLowerCase(), emailOrUsername.toLowerCase()]
      );

      if (results.length === 0 || results[0].values.length === 0) {
        return { success: false, error: 'Invalid credentials' };
      }

      const user = this.rowToUser(results[0].columns, results[0].values[0]);

      // Verify password
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Update last login
      const now = new Date().toISOString();
      this.db.run('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?', [
        now,
        now,
        user.id,
      ]);

      // Create session
      await this.createSession(user.id);

      this.saveToLocalStorage();

      return { success: true, user: this.toUserProfile({ ...user, lastLoginAt: now }) };
    } catch (error) {
      console.error('Sign in failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed',
      };
    }
  }

  /**
   * Sign out the current user.
   */
  async signOut(): Promise<void> {
    const session = this.getStoredSession();
    if (session && this.db) {
      this.db.run('DELETE FROM sessions WHERE token = ?', [session.token]);
      this.saveToLocalStorage();
    }
    localStorage.removeItem(SESSION_KEY);
  }

  /**
   * Get the current authenticated user from session.
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    const session = this.getStoredSession();
    if (!session) return null;

    if (!this.db) {
      await this.initialize();
    }

    if (!this.db) return null;

    // Verify session is valid
    const sessionResults = this.db.exec(
      'SELECT user_id, expires_at FROM sessions WHERE token = ? LIMIT 1',
      [session.token]
    );

    if (sessionResults.length === 0 || sessionResults[0].values.length === 0) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    const [userId, expiresAt] = sessionResults[0].values[0] as [string, string];

    // Check if session expired
    if (new Date(expiresAt) < new Date()) {
      this.db.run('DELETE FROM sessions WHERE token = ?', [session.token]);
      this.saveToLocalStorage();
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    const user = this.getUserById(userId);
    return user ? this.toUserProfile(user) : null;
  }

  /**
   * Create or update a user from GitHub OAuth.
   * @param credentials - GitHub credentials including tokens and user info
   * @param email - User email from GitHub (may be null if private)
   * @param name - User display name from GitHub
   */
  async signInWithGitHub(
    credentials: GitHubCredentials,
    email: string | null,
    name: string | null
  ): Promise<AuthResult> {
    if (!this.db) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const {
        githubId,
        githubUsername,
        accessToken,
        tokenExpiresAt,
        refreshToken,
        refreshTokenExpiresAt,
      } = credentials;

      // Check if user exists with this GitHub ID
      const existingGitHub = this.db.exec(
        'SELECT * FROM users WHERE github_id = ? LIMIT 1',
        [githubId]
      );

      const now = new Date().toISOString();

      if (existingGitHub.length > 0 && existingGitHub[0].values.length > 0) {
        // Update existing user
        const user = this.rowToUser(existingGitHub[0].columns, existingGitHub[0].values[0]);

        this.db.run(
          `UPDATE users SET
            github_username = ?,
            github_access_token = ?,
            github_token_expires_at = ?,
            github_refresh_token = ?,
            github_refresh_token_expires_at = ?,
            last_login_at = ?,
            updated_at = ?
           WHERE id = ?`,
          [
            githubUsername,
            accessToken,
            tokenExpiresAt,
            refreshToken,
            refreshTokenExpiresAt,
            now,
            now,
            user.id,
          ]
        );

        await this.createSession(user.id);
        this.saveToLocalStorage();

        return {
          success: true,
          user: this.toUserProfile({
            ...user,
            githubUsername,
            githubAccessToken: accessToken,
            githubTokenExpiresAt: tokenExpiresAt,
            githubRefreshToken: refreshToken,
            githubRefreshTokenExpiresAt: refreshTokenExpiresAt,
            lastLoginAt: now,
          }),
        };
      }

      // Check if email exists (link accounts)
      if (email) {
        const existingEmail = this.db.exec(
          'SELECT * FROM users WHERE email = ? LIMIT 1',
          [email.toLowerCase()]
        );

        if (existingEmail.length > 0 && existingEmail[0].values.length > 0) {
          const user = this.rowToUser(existingEmail[0].columns, existingEmail[0].values[0]);

          // Link GitHub to existing account
          this.db.run(
            `UPDATE users SET
              github_id = ?,
              github_username = ?,
              github_access_token = ?,
              github_token_expires_at = ?,
              github_refresh_token = ?,
              github_refresh_token_expires_at = ?,
              last_login_at = ?,
              updated_at = ?
             WHERE id = ?`,
            [
              githubId,
              githubUsername,
              accessToken,
              tokenExpiresAt,
              refreshToken,
              refreshTokenExpiresAt,
              now,
              now,
              user.id,
            ]
          );

          await this.createSession(user.id);
          this.saveToLocalStorage();

          return {
            success: true,
            user: this.toUserProfile({
              ...user,
              githubId,
              githubUsername,
              githubAccessToken: accessToken,
              githubTokenExpiresAt: tokenExpiresAt,
              githubRefreshToken: refreshToken,
              githubRefreshTokenExpiresAt: refreshTokenExpiresAt,
              lastLoginAt: now,
            }),
          };
        }
      }

      // Create new user from GitHub
      const userId = generateId();
      const [firstName, ...surnameArr] = (name || githubUsername).split(' ');
      const surname = surnameArr.join(' ') || '';
      const userEmail = email || `${githubUsername}@github.local`;

      // Generate a random password hash (user can set password later)
      const randomPassword = generateId() + generateId();
      const passwordHash = await hashPassword(randomPassword);

      this.db.run(
        `INSERT INTO users (
          id, email, username, first_name, surname, password_hash,
          created_at, updated_at, last_login_at,
          github_id, github_username, github_access_token,
          github_token_expires_at, github_refresh_token, github_refresh_token_expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          userEmail.toLowerCase(),
          githubUsername.toLowerCase(),
          firstName,
          surname,
          passwordHash,
          now,
          now,
          now,
          githubId,
          githubUsername,
          accessToken,
          tokenExpiresAt,
          refreshToken,
          refreshTokenExpiresAt,
        ]
      );

      await this.createSession(userId);
      this.saveToLocalStorage();

      const newUser = this.getUserById(userId);
      if (!newUser) {
        return { success: false, error: 'Failed to create user' };
      }

      return { success: true, user: this.toUserProfile(newUser) };
    } catch (error) {
      console.error('GitHub sign in failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GitHub sign in failed',
      };
    }
  }

  /**
   * Create a password reset token for a user.
   */
  async createPasswordResetToken(email: string): Promise<{ success: boolean; token?: string; error?: string }> {
    if (!this.db) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const results = this.db.exec('SELECT id FROM users WHERE email = ? LIMIT 1', [
        email.toLowerCase(),
      ]);

      if (results.length === 0 || results[0].values.length === 0) {
        // Don't reveal if email exists
        return { success: true };
      }

      const userId = results[0].values[0][0] as string;
      const token = generateId() + generateId();
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

      // Invalidate existing tokens
      this.db.run('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);

      // Create new token
      this.db.run(
        `INSERT INTO password_reset_tokens (id, user_id, token, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [generateId(), userId, token, expiresAt, now]
      );

      this.saveToLocalStorage();

      return { success: true, token };
    } catch (error) {
      console.error('Failed to create reset token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create reset token',
      };
    }
  }

  /**
   * Reset password using a token.
   */
  async resetPassword(token: string, newPassword: string): Promise<AuthResult> {
    if (!this.db) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const results = this.db.exec(
        `SELECT user_id, expires_at, used_at FROM password_reset_tokens WHERE token = ? LIMIT 1`,
        [token]
      );

      if (results.length === 0 || results[0].values.length === 0) {
        return { success: false, error: 'Invalid or expired reset link' };
      }

      const [userId, expiresAt, usedAt] = results[0].values[0] as [string, string, string | null];

      if (usedAt) {
        return { success: false, error: 'Reset link already used' };
      }

      if (new Date(expiresAt) < new Date()) {
        return { success: false, error: 'Reset link has expired' };
      }

      // Update password
      const passwordHash = await hashPassword(newPassword);
      const now = new Date().toISOString();

      this.db.run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [
        passwordHash,
        now,
        userId,
      ]);

      // Mark token as used
      this.db.run('UPDATE password_reset_tokens SET used_at = ? WHERE token = ?', [now, token]);

      // Clear all sessions for this user
      this.db.run('DELETE FROM sessions WHERE user_id = ?', [userId]);

      this.saveToLocalStorage();

      const user = this.getUserById(userId);
      return user
        ? { success: true, user: this.toUserProfile(user) }
        : { success: false, error: 'User not found' };
    } catch (error) {
      console.error('Failed to reset password:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset password',
      };
    }
  }

  /**
   * Update user profile.
   */
  async updateProfile(
    userId: string,
    updates: { firstName?: string; surname?: string; username?: string }
  ): Promise<AuthResult> {
    if (!this.db) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const user = this.getUserById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Check username availability if changing
      if (updates.username && updates.username.toLowerCase() !== user.username) {
        const existing = this.db.exec(
          'SELECT id FROM users WHERE username = ? AND id != ? LIMIT 1',
          [updates.username.toLowerCase(), userId]
        );
        if (existing.length > 0 && existing[0].values.length > 0) {
          return { success: false, error: 'Username already taken' };
        }
      }

      const now = new Date().toISOString();
      const firstName = updates.firstName ?? user.firstName;
      const surname = updates.surname ?? user.surname;
      const username = updates.username?.toLowerCase() ?? user.username;

      this.db.run(
        'UPDATE users SET first_name = ?, surname = ?, username = ?, updated_at = ? WHERE id = ?',
        [firstName, surname, username, now, userId]
      );

      this.saveToLocalStorage();

      const updatedUser = this.getUserById(userId);
      return updatedUser
        ? { success: true, user: this.toUserProfile(updatedUser) }
        : { success: false, error: 'Failed to update profile' };
    } catch (error) {
      console.error('Failed to update profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update profile',
      };
    }
  }

  // Private helper methods

  private async createSession(userId: string): Promise<void> {
    if (!this.db) return;

    const token = generateSessionToken();
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + SESSION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    // Clean up old sessions for this user
    this.db.run('DELETE FROM sessions WHERE user_id = ?', [userId]);

    // Create new session
    this.db.run(
      'INSERT INTO sessions (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
      [generateId(), userId, token, expiresAt, now.toISOString()]
    );

    // Store session in localStorage
    const session: Session = { userId, token, expiresAt };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  private getStoredSession(): Session | null {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private getUserById(id: string): User | null {
    if (!this.db) return null;

    const results = this.db.exec('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    if (results.length === 0 || results[0].values.length === 0) {
      return null;
    }

    return this.rowToUser(results[0].columns, results[0].values[0]);
  }

  private rowToUser(columns: string[], row: unknown[]): User {
    const data: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      data[col] = row[i];
    });

    return {
      id: data.id as string,
      email: data.email as string,
      username: data.username as string,
      firstName: data.first_name as string,
      surname: data.surname as string,
      passwordHash: data.password_hash as string,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
      lastLoginAt: (data.last_login_at as string) || null,
      githubId: (data.github_id as string) || null,
      githubUsername: (data.github_username as string) || null,
      githubAccessToken: (data.github_access_token as string) || null,
      githubTokenExpiresAt: (data.github_token_expires_at as string) || null,
      githubRefreshToken: (data.github_refresh_token as string) || null,
      githubRefreshTokenExpiresAt: (data.github_refresh_token_expires_at as string) || null,
    };
  }

  /**
   * Check if a GitHub token is valid (not expired).
   */
  private isGithubTokenValid(user: User): boolean {
    if (!user.githubAccessToken || !user.githubTokenExpiresAt) {
      return false;
    }
    return new Date(user.githubTokenExpiresAt) > new Date();
  }

  private toUserProfile(user: User): UserProfile {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      surname: user.surname,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      githubUsername: user.githubUsername,
      isGithubLinked: !!user.githubId,
      hasValidGithubToken: this.isGithubTokenValid(user),
    };
  }

  /**
   * Close the database connection.
   */
  close(): void {
    if (this.db) {
      this.saveToLocalStorage();
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

// Singleton instance
let authStorageInstance: AuthStorageProvider | null = null;

export function getAuthStorage(): AuthStorageProvider {
  if (!authStorageInstance) {
    authStorageInstance = new AuthStorageProvider();
  }
  return authStorageInstance;
}
