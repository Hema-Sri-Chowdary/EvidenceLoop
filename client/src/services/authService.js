import apiClient from './api.js';

const TOKEN_KEY = 'evidenceloop_token';
const USER_KEY = 'evidenceloop_user';

export const authService = {
  getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.warn('Failed to persist token:', e);
    }
  },

  getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setUser(user) {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to persist user:', e);
    }
  },

  clearAuth() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.warn('Failed to clear auth:', e);
    }
  },

  /**
   * Step 1: Login with credentials (returns mfaRequired and otpSessionToken)
   */
  async login(email, password) {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },

  /**
   * Step 2: Verify 6-digit MFA OTP and receive JWT token
   */
  async verifyMfa(otpSessionToken, otp) {
    const res = await apiClient.post('/auth/verify-mfa', { otpSessionToken, otp });
    if (res.data && res.data.token && res.data.user) {
      this.setToken(res.data.token);
      this.setUser(res.data.user);
    }
    return res.data;
  },

  /**
   * Resend MFA OTP to registered account
   */
  async resendOtp(otpSessionToken) {
    const res = await apiClient.post('/auth/resend-otp', { otpSessionToken });
    return res.data;
  },

  /**
   * Register a new user account
   */
  async register({ name, email, password, org }) {
    const res = await apiClient.post('/auth/register', { name, email, password, org });
    return res.data;
  },

  /**
   * Fetch current authenticated user profile
   */
  async getMe() {
    const res = await apiClient.get('/auth/me');
    if (res.data && res.data.user) {
      this.setUser(res.data.user);
    }
    return res.data;
  },

  /**
   * Update authenticated user's profile (name & org)
   */
  async updateProfile({ name, org }) {
    const res = await apiClient.put('/auth/me', { name, org });
    if (res.data && res.data.user) {
      this.setUser(res.data.user);
    }
    return res.data;
  },

  /**
   * Permanently delete authenticated user's account
   */
  async deleteAccount() {
    const res = await apiClient.delete('/auth/me');
    this.clearAuth();
    return res.data;
  },

  /**
   * Fetch preset demo accounts for one-click testing
   */
  async getDemoAccounts() {
    try {
      const res = await apiClient.get('/auth/demo-accounts');
      return res.data?.data || [];
    } catch {
      return [];
    }
  },
};

export default authService;
