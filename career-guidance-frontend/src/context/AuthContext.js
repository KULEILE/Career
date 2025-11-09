import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../services/firebase';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register function
  const register = async (formData) => {
    const { email, password, firstName, lastName, role, institutionName, companyName } = formData;

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Set display name
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`
      });

      // Prepare user data for Firestore
      const userData = {
        uid: user.uid,
        email: email,
        firstName: firstName,
        lastName: lastName,
        role: role,
        createdAt: new Date(),
        updatedAt: new Date(),
        approved: role === 'admin' // Auto-approve admins
      };

      // Add role-specific data
      if (role === 'institution' && institutionName) {
        userData.institutionName = institutionName;
        userData.approved = false; // Institutions need approval
      }

      if (role === 'company' && companyName) {
        userData.companyName = companyName;
        userData.approved = false; // Companies need approval
      }

      if (role === 'student') {
        userData.subjects = [];
        userData.hasTranscript = false;
      }

      // Save user data to Firestore
      await setDoc(doc(db, 'users', user.uid), userData);

      // Update local state
      setCurrentUser(user);
      setUserProfile(userData);

      // Store token
      const token = await user.getIdToken();
      localStorage.setItem('token', token);

      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Store token
      const token = await user.getIdToken();
      localStorage.setItem('token', token);
      
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Logout function
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

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    if (!currentUser) return;
    
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        ...updates,
        updatedAt: new Date()
      }, { merge: true });
      
      // Update local state
      setUserProfile(prev => ({ ...prev, ...updates }));
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Fetch user profile from Firestore
        const profile = await fetchUserProfile(user.uid);
        setUserProfile(profile);
        
        // Update token
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

  const value = {
    // State
    currentUser,
    userProfile,
    loading,
    
    // Actions
    register,
    login,
    logout,
    updateUserProfile,
    fetchUserProfile,
    
    // Derived state
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