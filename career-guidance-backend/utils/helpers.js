const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const generateApplicationId = () => {
  return `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const calculateGPA = (subjects) => {
  if (!subjects || subjects.length === 0) return 0;
  
  const gradePoints = {
    'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'E': 0.5, 'F': 0
  };
  
  const totalPoints = subjects.reduce((sum, subject) => {
    return sum + (gradePoints[subject.grade] || 0);
  }, 0);
  
  return (totalPoints / subjects.length).toFixed(2);
};

const isApplicationDeadlinePassed = (deadline) => {
  return new Date(deadline) < new Date();
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-LS', {
    style: 'currency',
    currency: 'LSL'
  }).format(amount);
};

module.exports = {
  formatDate,
  calculateAge,
  validateEmail,
  generateApplicationId,
  calculateGPA,
  isApplicationDeadlinePassed,
  formatCurrency
};