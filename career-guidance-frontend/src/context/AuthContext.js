// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register new user with email verification
  async function register(userData) {
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      const user = userCredential.user;

      // Send email verification immediately after registration
      await sendEmailVerification(user);
      
      // Update user profile with display name
      if (userData.firstName && userData.lastName) {
        await updateProfile(user, {
          displayName: `${userData.firstName} ${userData.lastName}`
        });
      } else if (userData.organizationName) {
        await updateProfile(user, {
          displayName: userData.organizationName
        });
      }

      // Prepare user data for Firestore
      const userProfileData = {
        uid: user.uid,
        email: userData.email,
        emailVerified: false,
        role: userData.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add role-specific data
      if (userData.role === 'student' || userData.role === 'admin') {
        userProfileData.firstName = userData.firstName;
        userProfileData.lastName = userData.lastName;
      }

      if (userData.role === 'student') {
        userProfileData.dateOfBirth = userData.dateOfBirth;
        userProfileData.phone = userData.phone;
        userProfileData.highSchool = userData.highSchool;
        userProfileData.graduationYear = userData.graduationYear;
      }

      if (userData.role === 'institution' || userData.role === 'company') {
        userProfileData.organizationName = userData.organizationName;
        userProfileData.contactPhone = userData.contactPhone;
        userProfileData.contactEmail = userData.contactEmail;
        userProfileData.location = userData.location;
        userProfileData.slogan = userData.slogan;
        userProfileData.description = userData.description;
      }

      // Save user profile to Firestore
      await setDoc(doc(db, 'users', user.uid), userProfileData);

      // IMPORTANT: Sign out the user immediately after registration
      // This prevents auto-login and forces them to verify email first
      await signOut(auth);

      return user;
    } catch (error) {
      // If there's an error, make sure to sign out
      await signOut(auth);
      throw error;
    }
  }

  // Login user with email verification check
  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Reload user to get the latest email verification status
      await user.reload();
      const updatedUser = auth.currentUser;
      
      // Check if email is verified
      if (!updatedUser.emailVerified) {
        await signOut(auth);
        throw new Error('Please verify your email before logging in. Check your inbox for the verification link. If you didn\'t receive it, you can request a new one.');
      }
      
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  // Send verification email
  async function sendVerificationEmail() {
    try {
      if (currentUser) {
        await sendEmailVerification(currentUser);
        return true;
      }
      return false;
    } catch (error) {
      throw error;
    }
  }

  // Check email verification status
  async function checkEmailVerification() {
    try {
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }
      await currentUser.reload();
      return currentUser.emailVerified;
    } catch (error) {
      throw error;
    }
  }

  // Resend verification email for unauthenticated users
  async function resendVerificationEmail(email) {
    try {
      // This would require a custom backend function since we can't send verification
      // without the user being signed in. For now, we'll throw an error.
      throw new Error('Please try to login first, then use the "Resend Verification" option from the login page.');
    } catch (error) {
      throw error;
    }
  }

  // Logout user
  async function logout() {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  }

  // Load user profile from Firestore
  async function loadUserProfile(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await loadUserProfile(user.uid);
        
        // Update email verification status in Firestore if needed
        if (user.emailVerified) {
          await setDoc(doc(db, 'users', user.uid), {
            emailVerified: true,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    register,
    login,
    logout,
    sendVerificationEmail,
    checkEmailVerification,
    resendVerificationEmail,
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
}