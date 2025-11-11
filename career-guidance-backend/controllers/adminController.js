const { db } = require('../config/firebase');

const getDashboard = async (req, res) => {
  try {
    const [
      studentsSnapshot,
      institutionsSnapshot,
      companiesSnapshot,
      applicationsSnapshot,
      jobsSnapshot
    ] = await Promise.all([
      db.collection('users').where('role', '==', 'student').get(),
      db.collection('users').where('role', '==', 'institution').get(),
      db.collection('users').where('role', '==', 'company').get(),
      db.collection('applications').get(),
      db.collection('jobs').get()
    ]);

    const stats = {
      totalStudents: studentsSnapshot.size,
      totalInstitutions: institutionsSnapshot.size,
      totalCompanies: companiesSnapshot.size,
      totalApplications: applicationsSnapshot.size,
      totalJobs: jobsSnapshot.size
    };

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getInstitutions = async (req, res) => {
  try {
    const institutionsSnapshot = await db.collection('users')
      .where('role', '==', 'institution')
      .get();

    const institutions = [];
    institutionsSnapshot.forEach(doc => {
      const data = doc.data();
      institutions.push({ 
        id: doc.id, 
        institutionName: data.institutionName || data.companyName || 'No Name',
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        description: data.description,
        contactInfo: data.contactInfo || {},
        approved: data.approved || false,
        createdAt: data.createdAt || new Date()
      });
    });

    res.json({ institutions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCompanies = async (req, res) => {
  try {
    const companiesSnapshot = await db.collection('users')
      .where('role', '==', 'company')
      .get();

    const companies = [];
    companiesSnapshot.forEach(doc => {
      const data = doc.data();
      companies.push({ 
        id: doc.id,
        companyName: data.companyName || data.institutionName || 'No Name',
        industry: data.industry || 'Not specified',
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        description: data.description,
        contactInfo: data.contactInfo || {},
        approved: data.approved || false,
        createdAt: data.createdAt || new Date()
      });
    });

    res.json({ companies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const approveCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    await db.collection('users').doc(companyId).update({
      approved: true,
      updatedAt: new Date()
    });

    res.json({ message: 'Company approved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const suspendCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    await db.collection('users').doc(companyId).update({
      approved: false,
      updatedAt: new Date()
    });

    res.json({ message: 'Company suspended successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();

    const users = [];
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      users.push({ 
        id: doc.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
        institutionName: data.institutionName,
        companyName: data.companyName,
        highSchool: data.highSchool,
        approved: data.approved !== false,
        createdAt: data.createdAt || new Date()
      });
    });

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getReports = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    let reportData = {};

    if (type === 'applications') {
      const applicationsSnapshot = await db.collection('applications').get();
      const applicationsByStatus = {
        pending: 0,
        admitted: 0,
        rejected: 0,
        waitlisted: 0,
        accepted: 0
      };
      
      applicationsSnapshot.forEach(doc => {
        const status = doc.data().status || 'pending';
        if (applicationsByStatus.hasOwnProperty(status)) {
          applicationsByStatus[status]++;
        }
      });
      
      reportData = applicationsByStatus;
    } else if (type === 'users') {
      const usersSnapshot = await db.collection('users').get();
      const userGrowth = [];
      const currentDate = new Date();
      
      // Generate last 6 months data
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = date.toLocaleString('default', { month: 'short' });
        
        userGrowth.push({
          month: monthName,
          students: 0,
          institutions: 0,
          companies: 0
        });
      }
      
      usersSnapshot.forEach(doc => {
        const user = doc.data();
        const userDate = user.createdAt ? new Date(user.createdAt) : new Date();
        const monthIndex = userGrowth.findIndex(item => {
          const itemDate = new Date();
          itemDate.setMonth(new Date().getMonth() - (5 - userGrowth.indexOf(item)));
          return itemDate.getMonth() === userDate.getMonth() && 
                 itemDate.getFullYear() === userDate.getFullYear();
        });
        
        if (monthIndex !== -1) {
          if (user.role === 'student') userGrowth[monthIndex].students++;
          else if (user.role === 'institution') userGrowth[monthIndex].institutions++;
          else if (user.role === 'company') userGrowth[monthIndex].companies++;
        }
      });
      
      reportData = userGrowth;
    }

    res.json({ report: reportData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    await db.collection('users').doc(userId).update({
      ...updateData,
      updatedAt: new Date()
    });

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    await db.collection('users').doc(userId).delete();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getDashboard,
  getInstitutions,
  getCompanies,
  approveCompany,
  suspendCompany,
  getUsers,
  getReports,
  updateUser,
  deleteUser
};