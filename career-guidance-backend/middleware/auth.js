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
      console.log('=== ROLE MIDDLEWARE DEBUG ===');
      console.log('Request path:', req.path);
      console.log('User UID:', req.user?.uid);
      console.log('Required roles:', roles);
      
      if (!req.user || !req.user.uid) {
        console.log('ERROR: No user in request');
        return res.status(401).json({ error: 'Authentication required' });
      }

      let userData = null;
      let userRole = null;
      let collectionType = '';
      
      // Check companies collection first for company routes
      if (roles.includes('company')) {
        console.log('Checking companies collection...');
        const companyDoc = await db.collection('companies').doc(req.user.uid).get();
        if (companyDoc.exists) {
          userData = companyDoc.data();
          userRole = userData.role;
          collectionType = 'company';
          console.log('✅ Found in companies collection');
          console.log('Company data role:', userRole);
          
          // Ensure company has role field
          if (!userRole) {
            console.log('Adding default role to company');
            await db.collection('companies').doc(req.user.uid).update({
              role: 'company',
              updatedAt: new Date()
            });
            userRole = 'company';
            userData.role = 'company';
          }
        }
      }
      
      // If not found in companies, check other collections
      if (!userRole) {
        console.log('Checking institutions collection...');
        const institutionDoc = await db.collection('institutions').doc(req.user.uid).get();
        if (institutionDoc.exists) {
          userData = institutionDoc.data();
          userRole = userData.role;
          collectionType = 'institution';
          console.log('✅ Found in institutions collection, role:', userRole);
        }
      }
      
      if (!userRole) {
        console.log('Checking users collection...');
        const userDoc = await db.collection('users').doc(req.user.uid).get();
        if (userDoc.exists) {
          userData = userDoc.data();
          userRole = userData.role;
          collectionType = 'user';
          console.log('✅ Found in users collection, role:', userRole);
        }
      }

      if (!userRole) {
        console.log('❌ User not found in ANY collection or no role defined');
        console.log('User UID:', req.user.uid);
        return res.status(404).json({ 
          error: 'User profile not found. Please complete your profile setup.',
          uid: req.user.uid
        });
      }

      console.log('Final determined role:', userRole);
      console.log('Collection type:', collectionType);

      if (!roles.includes(userRole)) {
        console.log(`❌ ACCESS DENIED: User role '${userRole}' not in required roles: ${roles.join(', ')}`);
        console.log('User is trying to access:', req.path);
        return res.status(403).json({ 
          error: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${userRole}`,
          yourRole: userRole,
          requiredRoles: roles
        });
      }

      console.log('✅ Role check PASSED - proceeding to route');
      console.log('=== END ROLE MIDDLEWARE DEBUG ===');
      
      req.user.role = userRole;
      req.user.profile = userData;
      req.user.collectionType = collectionType;
      
      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      return res.status(500).json({ 
        error: 'Internal server error during role verification',
        details: error.message 
      });
    }
  };
};

module.exports = { authenticate, requireRole };