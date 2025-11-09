const Joi = require('joi');

const registerValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Passwords do not match'
    }),
    role: Joi.string().valid('student', 'institution', 'company', 'admin').required(),

    // Personal name fields
    firstName: Joi.when('role', {
      is: Joi.valid('student', 'admin'),
      then: Joi.string().min(2).max(50).pattern(/^[A-Za-z\s'-]+$/).required().messages({
        'string.pattern.base': 'First name can only contain letters, spaces, hyphens, and apostrophes'
      }),
      otherwise: Joi.string().allow('').optional()
    }),
    lastName: Joi.when('role', {
      is: Joi.valid('student', 'admin'),
      then: Joi.string().min(2).max(50).pattern(/^[A-Za-z\s'-]+$/).required().messages({
        'string.pattern.base': 'Last name can only contain letters, spaces, hyphens, and apostrophes'
      }),
      otherwise: Joi.string().allow('').optional()
    }),

    // Organization name
    organizationName: Joi.when('role', {
      is: Joi.valid('institution', 'company'),
      then: Joi.string().min(2).max(100).pattern(/^[A-Za-z0-9\s\-&.,()']+$/).required().messages({
        'string.pattern.base': 'Organization name can only contain letters, numbers, spaces, and common punctuation'
      }),
      otherwise: Joi.string().allow('').optional()
    }),

    // Admin secret
    adminSecret: Joi.when('role', {
      is: 'admin',
      then: Joi.string().required(),
      otherwise: Joi.string().allow('').optional()
    }),

    // Student fields
    dateOfBirth: Joi.when('role', {
      is: 'student',
      then: Joi.date().max('now').required(),
      otherwise: Joi.date().allow('').optional()
    }),
    phone: Joi.when('role', {
      is: 'student',
      then: Joi.string().pattern(/^[\+]?[0-9\s\-\(\)]{8,20}$/).required(),
      otherwise: Joi.string().allow('').optional()
    }),
    highSchool: Joi.when('role', {
      is: 'student',
      then: Joi.string().min(2).max(100).required(),
      otherwise: Joi.string().allow('').optional()
    }),
    graduationYear: Joi.when('role', {
      is: 'student',
      then: Joi.number().integer().min(2000).max(new Date().getFullYear() + 5).required(),
      otherwise: Joi.number().allow('').optional()
    }),

    // Institution/Company contact fields
    contactPhone: Joi.when('role', {
      is: Joi.valid('institution', 'company'),
      then: Joi.string().pattern(/^[\+]?[0-9\s\-\(\)]{8,20}$/).required(),
      otherwise: Joi.string().allow('').optional()
    }),
    contactEmail: Joi.when('role', {
      is: Joi.valid('institution', 'company'),
      then: Joi.string().email().required(),
      otherwise: Joi.string().allow('').optional()
    }),
    location: Joi.when('role', {
      is: Joi.valid('institution', 'company'),
      then: Joi.string().min(3).max(100).required(),
      otherwise: Joi.string().allow('').optional()
    }),
    slogan: Joi.when('role', {
      is: Joi.valid('institution', 'company'),
      then: Joi.string().min(5).max(100).required(),
      otherwise: Joi.string().allow('').optional()
    }),
    description: Joi.when('role', {
      is: Joi.valid('institution', 'company'),
      then: Joi.string().min(10).max(500).required(),
      otherwise: Joi.string().allow('').optional()
    })
  }).with('password', 'confirmPassword');

  return schema.validate(data);
};

const courseValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().min(10).max(1000).required(),
    duration: Joi.string().min(1).max(50).required(),
    facultyId: Joi.string().required(),
    requirements: Joi.object({
      subjects: Joi.array().items(Joi.string().min(1)).required().min(1),
      minGrades: Joi.object().pattern(Joi.string(), Joi.string()).required().min(1)
    }).required(),
    institutionId: Joi.string().required(),
    tuitionFee: Joi.string().allow('').optional().max(100),
    intakePeriod: Joi.string().allow('').optional().max(100),
    applicationDeadline: Joi.date().allow('').optional(),
    availableSeats: Joi.number().integer().min(0).optional()
  });
  return schema.validate(data);
};

const applicationValidation = (data) => {
  const schema = Joi.object({
    courseId: Joi.string().required(),
    institutionId: Joi.string().required(),
    studentId: Joi.string().required(),
    subjects: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      grade: Joi.string().required()
    })).required().min(1)
  });
  return schema.validate(data);
};

const facultyValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().min(10).max(500).required(),
    dean: Joi.string().min(2).max(100).required(),
    contactEmail: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[\+]?[0-9\s\-\(\)]{8,20}$/).allow('').optional(),
    departments: Joi.array().items(Joi.string().min(1)).required(),
    institutionId: Joi.string().required()
  });
  return schema.validate(data);
};

const prospectusValidation = (data) => {
  const schema = Joi.object({
    title: Joi.string().min(2).max(100).required(),
    description: Joi.string().min(10).max(500).required(),
    academicYear: Joi.string().min(4).max(20).required(),
    institutionId: Joi.string().required(),
    fileUrl: Joi.string().uri().required(),
    fileName: Joi.string().required(),
    fileSize: Joi.number().integer().min(1).max(10485760),
    published: Joi.boolean().optional()
  });
  return schema.validate(data);
};

const institutionProfileValidation = (data) => {
  const schema = Joi.object({
    institutionName: Joi.string().min(2).max(100).required(),
    description: Joi.string().min(10).max(1000).required(),
    address: Joi.string().min(5).max(200).required(),
    logoUrl: Joi.string().uri().allow('').optional(),
    contactInfo: Joi.object({
      email: Joi.string().email().required(),
      phone: Joi.string().pattern(/^[\+]?[0-9\s\-\(\)]{8,20}$/).required(),
      website: Joi.string().uri().allow('').optional()
    }).required()
  });
  return schema.validate(data);
};

const admissionPublishValidation = (data) => {
  const schema = Joi.object({
    courseId: Joi.string().required(),
    publishAll: Joi.boolean().optional()
  });
  return schema.validate(data);
};

const applicationStatusValidation = (data) => {
  const schema = Joi.object({
    status: Joi.string().valid('pending', 'admitted', 'rejected', 'waitlisted').required(),
    notes: Joi.string().allow('').optional().max(500)
  });
  return schema.validate(data);
};

module.exports = {
  registerValidation,
  courseValidation,
  applicationValidation,
  facultyValidation,
  prospectusValidation,
  institutionProfileValidation,
  admissionPublishValidation,
  applicationStatusValidation
};
