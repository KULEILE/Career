export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[\+]?[266]?[\s]?[0-9]{4}[\s]?[0-9]{4}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateRequired = (value) => {
  return value && value.toString().trim().length > 0;
};

export const validateGrade = (grade) => {
  const validGrades = ['A', 'B', 'C', 'D', 'E', 'F'];
  return validGrades.includes(grade.toUpperCase());
};

export const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateDate = (date) => {
  return !isNaN(Date.parse(date));
};

export const validateFutureDate = (date) => {
  return new Date(date) > new Date();
};

export const validatePastDate = (date) => {
  return new Date(date) < new Date();
};

export const validateNumber = (value, min = null, max = null) => {
  const num = Number(value);
  if (isNaN(num)) return false;
  if (min !== null && num < min) return false;
  if (max !== null && num > max) return false;
  return true;
};