import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState('');

  const clearError = () => setError('');

  // --- Helper to get collection by role ---
  const getCollectionByRole = (role) => {
    switch (role) {
      case 'student':
      case 'admin':
        return 'users';
      case 'institution':
        return 'institutions';
      case 'company':
        return 'companies';
      default:
        return 'users';
    }
  };

  // --- Register function ---
  async function register(userData) {
    try {
      clearError();
      setAuthLoading(true);

      console.log('Starting registration for:', userData.email, 'Role:', userData.role);

      const { user } = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );

      console.log('Firebase user created:', user.uid);

      // Prepare profile data
      let profileData = {
        uid: user.uid,
        email: userData.email,
        role: userData.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add role-specific fields
      if (userData.role === 'student' || userData.role === 'admin') {
        profileData.firstName = userData.firstName;
        profileData.lastName = userData.lastName;
        if (userData.role === 'student') {
          profileData.dateOfBirth = userData.dateOfBirth;
          profileData.phone = userData.phone;
          profileData.highSchool = userData.highSchool;
          profileData.graduationYear = userData.graduationYear;
        }
      } else if (userData.role === 'institution' || userData.role === 'company') {
        profileData.name = userData.organizationName;
        profileData.contactEmail = userData.contactEmail;
        profileData.contactPhone = userData.contactPhone;
        profileData.location = userData.location;
        profileData.slogan = userData.slogan;
        profileData.description = userData.description;
        
        // Add approval status for companies/institutions
        profileData.approved = false;
      }

      // Update displayName in Firebase Auth
      const displayName = userData.role === 'student' || userData.role === 'admin'
        ? `${userData.firstName} ${userData.lastName}`
        : userData.organizationName;

      await updateProfile(user, { displayName });
      console.log('Firebase profile updated with displayName:', displayName);

      // Save to the correct collection
      const collectionName = getCollectionByRole(userData.role);
      console.log('Saving to collection:', collectionName);
      
      await setDoc(doc(db, collectionName, user.uid), profileData);
      console.log('Profile saved to Firestore');

      setUserProfile(profileData);
      return user;
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = getFirebaseErrorMessage(error.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  }

  // --- Login function ---
  async function login(email, password) {
    try {
      clearError();
      setAuthLoading(true);

      console.log('Attempting login for:', email);

      const { user } = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful, user UID:', user.uid);

      // Fetch profile from all possible collections
      const profile = await fetchUserProfile(user.uid);
      console.log('Fetched user profile:', profile);

      if (profile) {
        setUserProfile(profile);
        
        // Store role and profile in localStorage for API middleware
        localStorage.setItem('userRole', profile.role);
        localStorage.setItem('userProfile', JSON.stringify(profile));
        console.log('Stored user role in localStorage:', profile.role);
      } else {
        console.warn('No profile found for user:', user.uid);
      }

      return { user, profile };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = getFirebaseErrorMessage(error.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  }

  // --- Logout ---
  async function logout() {
    try {
      clearError();
      console.log('Logging out user');
      await signOut(auth);
      setUserProfile(null);
      // Clear stored data
      localStorage.removeItem('userRole');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('token');
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      const errorMessage = getFirebaseErrorMessage(error.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }

  // --- Update Profile ---
  async function updateUserProfile(uid, updates, role) {
    try {
      clearError();
      console.log('Updating profile for:', uid, 'Role:', role, 'Updates:', updates);
      
      const collectionName = getCollectionByRole(role);
      await updateDoc(doc(db, collectionName, uid), {
        ...updates,
        updatedAt: new Date().toISOString()
      });

      const userDoc = await getDoc(doc(db, collectionName, uid));
      if (userDoc.exists()) {
        const updatedProfile = userDoc.data();
        setUserProfile(updatedProfile);
        
        // Update localStorage
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        
        console.log('Profile updated successfully');
        return updatedProfile;
      }
    } catch (error) {
      console.error('Update profile error:', error);
      const errorMessage = getFirebaseErrorMessage(error.code);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }

  // --- Fetch Profile ---
  async function fetchUserProfile(uid) {
    const collections = ['users', 'institutions', 'companies'];
    console.log('Fetching profile for UID:', uid);
    
    try {
      for (let collection of collections) {
        const userDoc = await getDoc(doc(db, collection, uid));
        if (userDoc.exists()) {
          console.log(`✅ Found profile in ${collection} collection:`, userDoc.data());
          return userDoc.data();
        }
      }
      console.log('❌ No profile found in any collection');
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // --- Refresh User Profile ---
  async function refreshUserProfile() {
    if (currentUser) {
      console.log('Refreshing user profile');
      const profile = await fetchUserProfile(currentUser.uid);
      setUserProfile(profile);
      
      // Update localStorage
      if (profile) {
        localStorage.setItem('userProfile', JSON.stringify(profile));
        localStorage.setItem('userRole', profile.role);
      }
      
      return profile;
    }
    return null;
  }

  // --- Firebase Auth Error Messages ---
  function getFirebaseErrorMessage(errorCode) {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please use a different email or login.';
      case 'auth/invalid-email':
        return 'The email address is not valid.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled. Please contact support.';
      case 'auth/weak-password':
        return 'The password is too weak. Please choose a stronger password.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/too-many-requests':
        return 'Too many unsuccessful login attempts. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  // --- onAuthStateChanged listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        console.log('Auth state changed, user:', user ? user.uid : 'null');
        setCurrentUser(user);
        
        if (user) {
          const profile = await fetchUserProfile(user.uid);
          setUserProfile(profile);
          
          if (profile) {
            // Store role for API middleware
            localStorage.setItem('userRole', profile.role);
            localStorage.setItem('userProfile', JSON.stringify(profile));
            console.log('User authenticated with role:', profile.role);
          }
        } else {
          setUserProfile(null);
          localStorage.removeItem('userRole');
          localStorage.removeItem('userProfile');
          localStorage.removeItem('token');
          console.log('User signed out');
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setError('Failed to load user profile.');
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    error,
    loading: loading || authLoading,
    authLoading,
    register,
    login,
    logout,
    updateUserProfile,
    fetchUserProfile,
    refreshUserProfile,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}