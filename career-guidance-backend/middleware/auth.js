const { admin, db } = require('../config/firebase');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = { uid: decodedToken.uid, email: decodedToken.email };

    let userData = null;
    let collectionName = '';

    // Check all collections to find the user
    const institutionDoc = await db.collection('institutions').doc(decodedToken.uid).get();
    if (institutionDoc.exists) {
      userData = institutionDoc.data();
      collectionName = 'institutions';
    } else {
      const companyDoc = await db.collection('companies').doc(decodedToken.uid).get();
      if (companyDoc.exists) {
        userData = companyDoc.data();
        collectionName = 'companies';
      } else {
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        if (userDoc.exists) {
          userData = userDoc.data();
          collectionName = 'users';
        }
      }
    }

    if (!userData) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    req.user.role = userData.role;
    req.user.profile = userData;
    req.user.collection = collectionName; // Optional: for debugging

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied: insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticate, requireRole };