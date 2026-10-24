import React, {
  createContext, useContext, useState,
  useEffect, useCallback,
} from 'react';
import authApi from '../api/authApi';

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── AuthProvider ─────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true); // restoring session

  // ── Restore session from localStorage on app start ──────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    const storedUser  = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        // Corrupted storage — clear it
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  /**
   * login()
   * Called from LoginPage with { email, password }.
   * 1. POST /auth/login  → get access_token
   * 2. GET  /auth/me     → get user object
   * 3. Store both in localStorage + state
   */
  const login = useCallback(async (email, password) => {
    // Step 1 — get token
    const { access_token } = await authApi.login(email, password);

    // Step 2 — store token immediately so axios interceptor can use it
    localStorage.setItem('access_token', access_token);

    try {
      // Step 3 — fetch user profile using that token
      const userData = await authApi.getMe();

      // Step 4 — persist user
      localStorage.setItem('user', JSON.stringify(userData));

      // Step 5 — update state
      setToken(access_token);
      setUser(userData);

      // Return user so LoginPage can redirect based on role
      return userData;
    } catch (error) {
      // Do not leave a token behind if profile loading fails; otherwise a
      // later page refresh can restore a partially authenticated session.
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      throw error;
    }
  }, []);

  /**
   * logout()
   * Clears all stored auth data and resets state.
   */
  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  // ── Derived helpers ──────────────────────────────────────────────────────
  const isAuthenticated = !!token && !!user;

  // Backend returns uppercase role: 'STUDENT', 'STAFF', 'WARDEN', 'ADMIN'
  // We normalize to lowercase for route matching: 'student', 'staff', etc.
  const userRole = user?.role ? user.role.toLowerCase() : null;

  const value = {
    user,           // Full user object from /auth/me
    token,
    loading,
    isAuthenticated,
    userRole,       // lowercase: 'student' | 'staff' | 'warden' | 'admin'
    login,          // async (email, password) => userData
    updateUser,     // persist a profile update without reloading the app
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}

export default AuthContext;
