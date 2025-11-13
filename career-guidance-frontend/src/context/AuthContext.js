import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../services/firebase';
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithCustomToken 
} from 'firebase/auth';
import { registerUser, loginUser, getUserProfile } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // --------------------------
  // REGISTER FUNCTION
  // --------------------------
  const register = async (formData) => {
    try {
      if (formData.role === 'admin' && !formData.adminSecret) {
        throw new Error('Admin secret is required for admin registration');
      }

      const response = await registerUser(formData);

      if (response.data.token) {
        const userCredential = await signInWithCustomToken(auth, response.data.token);
        setCurrentUser(userCredential.user);

        const profile = await fetchUserProfile(userCredential.user);
        setUserProfile(profile || response.data.user);
      }

      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message || error);
      throw new Error(error.response?.data?.error || error.message || 'Registration failed');
    }
  };

  // --------------------------
  // LOGIN FUNCTION
  // --------------------------
  const login = async (email, password) => {
    try {
      const response = await loginUser({ email, password });

      if (response.data.token) {
        const userCredential = await signInWithCustomToken(auth, response.data.token);
        setCurrentUser(userCredential.user);

        const profile = await fetchUserProfile(userCredential.user);
        setUserProfile(profile || response.data.user);

        const token = await userCredential.user.getIdToken();
        localStorage.setItem('token', token);
      }

      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message || error);
      throw new Error(error.response?.data?.error || error.message || 'Login failed');
    }
  };

  // --------------------------
  // LOGOUT FUNCTION
  // --------------------------
  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // --------------------------
  // FETCH USER PROFILE
  // --------------------------
  const fetchUserProfile = async (user = auth.currentUser) => {
    if (!user) return null;
    try {
      const token = await user.getIdToken();
      if (!token) return null;

      const response = await getUserProfile(token);

      if (response.data && response.data.user) {
        return response.data.user;
      }
      return null;
    } catch (error) {
      if (error.response) {
        console.error('Server error fetching profile:', {
          status: error.response.status,
          data: error.response.data,
        });
      } else if (error.request) {
        console.error('Network error fetching profile - no response received:', error.request);
      } else {
        console.error('Error setting up profile request:', error.message);
      }
      return null;
    }
  };

  // --------------------------
  // UPDATE USER PROFILE
  // --------------------------
  const updateUserProfile = async (updates) => {
    try {
      setUserProfile(prev => ({ ...prev, ...updates }));
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // --------------------------
  // AUTH STATE LISTENER
  // --------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const profile = await fetchUserProfile(user);
        setUserProfile(profile || {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          role: 'unknown'
        });

        const token = await user.getIdToken();
        localStorage.setItem('token', token);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        localStorage.removeItem('token');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // --------------------------
  // REFRESH USER PROFILE
  // --------------------------
  const refreshUserProfile = async () => {
    if (!currentUser) return null;
    try {
      const profile = await fetchUserProfile();
      if (profile) setUserProfile(profile);
      return profile;
    } catch (error) {
      console.error('Error refreshing user profile:', error);
      return null;
    }
  };

  // --------------------------
  // CONTEXT VALUE
  // --------------------------
  const value = {
    currentUser,
    userProfile,
    loading,
    register,
    login,
    logout,
    updateUserProfile,
    fetchUserProfile: refreshUserProfile,
    refreshUserProfile,
    isAuthenticated: !!currentUser,
    userRole: userProfile?.role,
    isAdmin: userProfile?.role === 'admin',
    isInstitution: userProfile?.role === 'institution',
    isCompany: userProfile?.role === 'company',
    isStudent: userProfile?.role === 'student'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
