const { admin, db } = require('../config/firebase');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Auth middleware: No token provided');
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('Auth middleware: Token is empty');
      return res.status(401).json({ error: 'Access denied. Invalid token format.' });
    }

    console.log('Auth middleware: Verifying token...');
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    if (!decodedToken || !decodedToken.uid) {
      console.log('Auth middleware: Token verification failed - no UID');
      return res.status(401).json({ error: 'Invalid token.' });
    }

    console.log('Auth middleware: Token verified for user:', decodedToken.uid);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email
    };

    next();
  } catch (error) {
    console.error('Auth middleware: Token verification error:', error.message);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ error: 'Token revoked. Please login again.' });
    }
    
    return res.status(401).json({ error: 'Invalid token. Please login again.' });
  }
};

const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.uid) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      let userData = null;
      let userRole = null;
      
      const institutionDoc = await db.collection('institutions').doc(req.user.uid).get();
      if (institutionDoc.exists) {
        userData = institutionDoc.data();
        userRole = userData.role;
      } else {
        const companyDoc = await db.collection('companies').doc(req.user.uid).get();
        if (companyDoc.exists) {
          userData = companyDoc.data();
          userRole = userData.role;
        } else {
          const userDoc = await db.collection('users').doc(req.user.uid).get();
          if (userDoc.exists) {
            userData = userDoc.data();
            userRole = userData.role;
          }
        }
      }

      if (!userData) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      if (!userRole) {
        return res.status(403).json({ error: 'User role not defined' });
      }

      if (!roles.includes(userRole)) {
        return res.status(403).json({ 
          error: `Access denied. Required roles: ${roles.join(', ')}` 
        });
      }

      req.user.role = userRole;
      req.user.profile = userData;
      
      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      return res.status(500).json({ error: 'Internal server error during role verification' });
    }
  };
};

module.exports = { authenticate, requireRole };