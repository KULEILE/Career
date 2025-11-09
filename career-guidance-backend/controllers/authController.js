const { admin, db } = require('../config/firebase');
const { registerValidation } = require('../middleware/validation');

const register = async (req, res) => {
  try {
    // Validate data
    const { error } = registerValidation(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password, firstName, lastName, role, organizationName, contactPhone, contactEmail, location, slogan, description, dateOfBirth, phone, highSchool, graduationYear } = req.body;

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: role === 'student' || role === 'admin' ? `${firstName} ${lastName}` : organizationName,
      emailVerified: true
    });

    const timestamp = new Date();
    
    // Handle different roles with separate collections
    if (role === 'student') {
      // Store student in users collection
      const userData = {
        uid: userRecord.uid,
        email,
        firstName,
        lastName,
        role,
        dateOfBirth,
        phone,
        highSchool,
        graduationYear,
        subjects: [],
        applications: [],
        createdAt: timestamp,
        updatedAt: timestamp
      };

      await db.collection('users').doc(userRecord.uid).set(userData);

    } else if (role === 'institution') {
      // Store institution in institutions collection
      const institutionData = {
        uid: userRecord.uid,
        email,
        name: organizationName,
        contactPhone,
        contactEmail,
        location,
        slogan,
        description,
        role,
        approved: false,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      await db.collection('institutions').doc(userRecord.uid).set(institutionData);

      // Also create a minimal user record for authentication purposes
      const userData = {
        uid: userRecord.uid,
        email,
        role,
        institutionId: userRecord.uid, // Reference to the institution document
        createdAt: timestamp,
        updatedAt: timestamp
      };

      await db.collection('users').doc(userRecord.uid).set(userData);

    } else if (role === 'company') {
      // Store company in companies collection
      const companyData = {
        uid: userRecord.uid,
        email,
        name: organizationName,
        contactPhone,
        contactEmail,
        location,
        slogan,
        description,
        role,
        approved: false,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      await db.collection('companies').doc(userRecord.uid).set(companyData);

      // Also create a minimal user record for authentication purposes
      const userData = {
        uid: userRecord.uid,
        email,
        role,
        companyId: userRecord.uid, // Reference to the company document
        createdAt: timestamp,
        updatedAt: timestamp
      };

      await db.collection('users').doc(userRecord.uid).set(userData);

    } else if (role === 'admin') {
      // Store admin in users collection
      const userData = {
        uid: userRecord.uid,
        email,
        firstName,
        lastName,
        role,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      await db.collection('users').doc(userRecord.uid).set(userData);
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        role: role
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Get user data from Firestore based on role
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    let additionalData = {};

    // Get role-specific data
    if (userData.role === 'institution') {
      const institutionDoc = await db.collection('institutions').doc(decodedToken.uid).get();
      if (institutionDoc.exists) {
        additionalData = institutionDoc.data();
      }
    } else if (userData.role === 'company') {
      const companyDoc = await db.collection('companies').doc(decodedToken.uid).get();
      if (companyDoc.exists) {
        additionalData = companyDoc.data();
      }
    }

    res.json({
      message: 'Login successful',
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        ...userData,
        ...additionalData
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const getProfile = async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    let additionalData = {};

    // Get role-specific data
    if (userData.role === 'institution') {
      const institutionDoc = await db.collection('institutions').doc(req.user.uid).get();
      if (institutionDoc.exists) {
        additionalData = institutionDoc.data();
      }
    } else if (userData.role === 'company') {
      const companyDoc = await db.collection('companies').doc(req.user.uid).get();
      if (companyDoc.exists) {
        additionalData = companyDoc.data();
      }
    }

    res.json({ 
      user: {
        ...userData,
        ...additionalData
      } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, login, getProfile };