const { admin, db } = require('../config/firebase');
const { registerValidation } = require('../middleware/validation');

const register = async (req, res) => {
  try {
    console.log('Registration request received:', req.body); // Debug log

    // Validate data
    const { error } = registerValidation(req.body);
    if (error) {
      console.log('Validation error:', error.details[0].message);
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password, firstName, lastName, role, organizationName, contactPhone, contactEmail, location, slogan, description, dateOfBirth, phone, highSchool, graduationYear } = req.body;

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: role === 'student' || role === 'admin' ? `${firstName} ${lastName}` : organizationName,
      emailVerified: false
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
      // Store institution ONLY in institutions collection
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

    } else if (role === 'company') {
      // Store company ONLY in companies collection
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

    console.log('User registered successfully:', userRecord.uid);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        role: role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Create a custom token for the user
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    let userData = null;
    let collectionName = '';

    // Determine which collection to query based on user type
    const institutionDoc = await db.collection('institutions').doc(userRecord.uid).get();
    if (institutionDoc.exists) {
      userData = institutionDoc.data();
      collectionName = 'institutions';
    } else {
      const companyDoc = await db.collection('companies').doc(userRecord.uid).get();
      if (companyDoc.exists) {
        userData = companyDoc.data();
        collectionName = 'companies';
      } else {
        const userDoc = await db.collection('users').doc(userRecord.uid).get();
        if (userDoc.exists) {
          userData = userDoc.data();
          collectionName = 'users';
        }
      }
    }

    if (!userData) {
      return res.status(404).json({ error: 'User not found in any collection' });
    }

    res.json({
      message: 'Login successful',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        ...userData,
        collection: collectionName
      },
      token: customToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Invalid email or password' });
  }
};

const getProfile = async (req, res) => {
  try {
    let userData = null;

    // Check institutions collection first
    const institutionDoc = await db.collection('institutions').doc(req.user.uid).get();
    if (institutionDoc.exists) {
      userData = institutionDoc.data();
    } else {
      // Check companies collection
      const companyDoc = await db.collection('companies').doc(req.user.uid).get();
      if (companyDoc.exists) {
        userData = companyDoc.data();
      } else {
        // Check users collection (students/admins)
        const userDoc = await db.collection('users').doc(req.user.uid).get();
        if (userDoc.exists) {
          userData = userDoc.data();
        }
      }
    }

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      user: userData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, login, getProfile };