// validations/auth_validation.js
// Joi validation middleware — Firebase removed, Passport.js compatible

const Joi = require('joi');

// ═══════════════════════════════════════════════════════════════════════════════
//  REGISTER SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════
const registerSchema = Joi.object({

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .max(255)
    .required()
    .messages({
      'string.email':    'Invalid email address',
      'string.max':      'Email must not exceed 255 characters',
      'any.required':    'Email is required',
      'string.empty':    'Email cannot be empty'
    }),

  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min':   'Password must be at least 6 characters',
      'string.max':   'Password must not exceed 128 characters',
      'any.required': 'Password is required',
      'string.empty': 'Password cannot be empty'
    }),

  // confirmPassword is validated on the client; we just strip it server-side
  confirmPassword: Joi.string().allow('', null).optional(),

  // ── Donor / Indigent fields ────────────────────────────────────────────────
  firstName: Joi.when('userType', {
    not: 'charity',
    then: Joi.string().trim().min(2).max(50).required()
      .pattern(/^[a-zA-Z0-9_\s\-']+$/, { name: 'alphanumeric with spaces, hyphens and apostrophes' })
      .messages({
        'string.min':   'First name must be at least 2 characters',
        'string.max':   'First name must be at most 50 characters',
        'any.required': 'First name is required',
        'string.empty': 'First name cannot be empty',
        'string.pattern.name': 'First name contains invalid characters'
      }),
    otherwise: Joi.string().allow('', null).optional()
  }),

  lastName: Joi.when('userType', {
    not: 'charity',
    then: Joi.string().trim().min(2).max(50).required()
      .pattern(/^[a-zA-Z0-9_\s\-']+$/, { name: 'alphanumeric with spaces, hyphens and apostrophes' })
      .messages({
        'string.min':   'Last name must be at least 2 characters',
        'string.max':   'Last name must be at most 50 characters',
        'any.required': 'Last name is required',
        'string.empty': 'Last name cannot be empty',
        'string.pattern.name': 'Last name contains invalid characters'
      }),
    otherwise: Joi.string().allow('', null).optional()
  }),

  gender: Joi.when('userType', {
    not: 'charity',
    then: Joi.string()
      .valid('male', 'female', 'Male', 'Female', 'MALE', 'FEMALE')
      .required()
      .messages({
        'any.only':     'Gender must be male or female',
        'any.required': 'Gender is required',
        'string.empty': 'Gender cannot be empty'
      }),
    otherwise: Joi.string()
      .valid('male', 'female', 'Male', 'Female', 'MALE', 'FEMALE')
      .optional()
  }),

  birthDate: Joi.when('userType', {
    not: 'charity',
    then: Joi.date().max('now').required()
      .messages({
        'date.base':    'Invalid birth date',
        'date.max':     'Birth date must be in the past',
        'any.required': 'Birth date is required'
      }),
    otherwise: Joi.date().max('now').optional()
  }),

  // ── Charity-specific fields ────────────────────────────────────────────────
  charityName: Joi.when('userType', {
    is: 'charity',
    then: Joi.string().trim().min(2).max(100).required()
      .messages({
        'string.min':   'Charity name must be at least 2 characters',
        'string.max':   'Charity name must not exceed 100 characters',
        'any.required': 'Charity name is required',
        'string.empty': 'Charity name cannot be empty'
      }),
    otherwise: Joi.string().allow('', null).optional()
  }),

  charityDescription: Joi.when('userType', {
    is: 'charity',
    then: Joi.string().trim().min(10).max(500).required()
      .messages({
        'string.min':   'Charity description must be at least 10 characters',
        'string.max':   'Charity description must not exceed 500 characters',
        'any.required': 'Charity description is required',
        'string.empty': 'Charity description cannot be empty'
      }),
    otherwise: Joi.string().allow('', null).optional()
  }),

  charityDate: Joi.when('userType', {
    is: 'charity',
    then: Joi.date().max('now').required()
      .messages({
        'date.base':    'Invalid establishment date',
        'date.max':     'Establishment date must be in the past',
        'any.required': 'Establishment date is required'
      }),
    otherwise: Joi.date().allow(null).optional()
  }),

  charityType: Joi.when('userType', {
    is: 'charity',
    then: Joi.string().trim().min(2).max(50).required()
      .messages({
        'any.required': 'Charity type is required',
        'string.empty': 'Charity type cannot be empty',
        'string.min':   'Charity type must be at least 2 characters',
        'string.max':   'Charity type must not exceed 50 characters'
      }),
    otherwise: Joi.string().allow('', null).optional()
  }),

  // ── Phone ──────────────────────────────────────────────────────────────────
  full_phone_number: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .max(20)
    .required()
    .messages({
      'string.pattern.base': 'Invalid phone number format (e.g. +1234567890)',
      'string.max':          'Phone number must not exceed 20 characters',
      'any.required':        'Phone number is required',
      'string.empty':        'Phone number cannot be empty'
    }),

  phone_number: Joi.string().max(30).optional().allow('', null),
  phone_code:   Joi.string().max(10).optional().allow('', null),
  phone_national: Joi.string().max(30).optional().allow(''),
  phone_international: Joi.string().max(30).optional().allow(''),
  phone_country_iso: Joi.string().length(2).uppercase().optional().allow('')
    .messages({ 'string.length': 'Country ISO code must be exactly 2 characters' }),


  // ── Links ───────────────────────────────────────────────────────────────

  charityWebsite:  Joi.string().uri().allow('', null).optional().max(255),
  charityFacebook: Joi.string().uri().allow('', null).optional().max(255),
  charityInstagram:Joi.string().uri().allow('', null).optional().max(255),
  charityLinkedIn: Joi.string().uri().allow('', null).optional().max(255),
  charityX:        Joi.string().uri().allow('', null).optional().max(255),

  // ── Links validation ───────────────────────────────────────────────────────
  charityWebsite: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .allow('', null)
    .optional()
    .max(255)
    .messages({
      'string.uri': 'Website must be a valid URL (e.g., https://example.com)'
    }),

  charityFacebook: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .allow('', null)
    .optional()
    .max(255)
    .messages({
      'string.uri': 'Facebook link must be a valid URL'
    }),

  charityInstagram: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .allow('', null)
    .optional()
    .max(255)
    .messages({
      'string.uri': 'Instagram link must be a valid URL'
    }),

  charityLinkedIn: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .allow('', null)
    .optional()
    .max(255)
    .messages({
      'string.uri': 'LinkedIn link must be a valid URL'
    }),

  charityX: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .allow('', null)
    .optional()
    .max(255)
    .messages({
      'string.uri': 'X platform link must be a valid URL'
    }),
  // ── Location ───────────────────────────────────────────────────────────────
  location: Joi.object({
    latitude: Joi.alternatives().try(
      Joi.number().min(-90).max(90),
      Joi.string().pattern(/^-?\d+\.?\d*$/).custom((value, helpers) => {
        const num = parseFloat(value);
        if (isNaN(num) || num < -90 || num > 90) return helpers.error('number.range');
        return num;
      })
    ).required()
      .messages({
        'any.required':  'Latitude is required',
        'number.range':  'Latitude must be between -90 and 90',
        'number.min':    'Latitude must be between -90 and 90',
        'number.max':    'Latitude must be between -90 and 90'
      }),
    longitude: Joi.alternatives().try(
      Joi.number().min(-180).max(180),
      Joi.string().pattern(/^-?\d+\.?\d*$/).custom((value, helpers) => {
        const num = parseFloat(value);
        if (isNaN(num) || num < -180 || num > 180) return helpers.error('number.range');
        return num;
      })
    ).required()
      .messages({
        'any.required':  'Longitude is required',
        'number.range':  'Longitude must be between -180 and 180',
        'number.min':    'Longitude must be between -180 and 180',
        'number.max':    'Longitude must be between -180 and 180'
      })
  }).required()
    .messages({ 'any.required': 'Location is required' }),

  // ── Image ────────────────────────────────────────────────────────────────
  image: Joi.any()
    .custom((value, helpers) => {
      // Image is handled by multer middleware; this ensures presence
      if (!value || (typeof value === 'object' && !value.mimetype)) {
        return helpers.error('any.required');
      }
      return value;
    })
    .messages({
      'any.required': 'Profile image is required'
    }),  
  // ── User type ──────────────────────────────────────────────────────────────
  userType: Joi.string()
    .valid('requester', 'donor', 'charity')
    .required()
    .messages({
      'any.only':     'User type must be requester, donor, or charity',
      'any.required': 'User type is required',
      'string.empty': 'User type cannot be empty'
    }),
});

// ═══════════════════════════════════════════════════════════════════════════════
//  LOGIN SCHEMA  (email + password, validated before passport.authenticate)
// ═══════════════════════════════════════════════════════════════════════════════
const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .max(255)
    .required()
    .messages({
      'string.email':    'Invalid email address',
      'any.required':    'Email is required',
      'string.empty':    'Email cannot be empty',
      'string.max':      'Email must not exceed 255 characters'
    }),
  password: Joi.string().min(1).max(128).required()
    .messages({
      'any.required': 'Password is required',
      'string.empty': 'Password cannot be empty',
      'string.max':   'Password must not exceed 128 characters'
    })
});

// ═══════════════════════════════════════════════════════════════════════════════
//  VERIFY EMAIL SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════
const verifyEmailSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .max(255)
    .required()
    .messages({
      'string.email':    'Invalid email address',
      'any.required':    'Email is required',
      'string.empty':    'Email cannot be empty',
      'string.max':      'Email must not exceed 255 characters'
    }),
  verifyCode: Joi.string().length(6).pattern(/^\d+$/).required()
    .messages({
      'string.length':       'Verification code must be exactly 6 digits',
      'string.pattern.base': 'Verification code must contain digits only',
      'any.required':        'Verification code is required',
      'string.empty':        'Verification code cannot be empty'
    })
});

// ═══════════════════════════════════════════════════════════════════════════════
//  UPDATE PASSWORD SCHEMA  (authenticated user changing their own password)
// ═══════════════════════════════════════════════════════════════════════════════
const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(1).max(128).required()
    .messages({
      'any.required': 'Current password is required',
      'string.empty': 'Current password cannot be empty',
      'string.max':   'Password must not exceed 128 characters'
    }),
  newPassword: Joi.string().min(6).max(128).required()
    .messages({
      'string.min':   'New password must be at least 6 characters',
      'string.max':   'New password must not exceed 128 characters',
      'any.required': 'New password is required',
      'string.empty': 'New password cannot be empty'
    })
});

// ═══════════════════════════════════════════════════════════════════════════════
//  PASSWORD RESET SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════
const sendPasswordResetCodeSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
    .max(255)
    .required()
    .messages({
      'string.email':    'Invalid email address',
      'any.required':    'Email is required',
      'string.empty':    'Email cannot be empty',
      'string.max':      'Email must not exceed 255 characters'
    })
});

const verifyResetCodeSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim().max(255).required()
    .messages({
      'string.email': 'Invalid email address',
      'any.required': 'Email is required',
      'string.empty': 'Email cannot be empty'
    }),
  code:  Joi.string().length(6).pattern(/^\d+$/).required()
    .messages({
      'string.length':       'Reset code must be exactly 6 digits',
      'string.pattern.base': 'Reset code must contain digits only',
      'any.required':        'Reset code is required'
    })
});

const verifyResetPasswordSchema = Joi.object({
  email:       Joi.string().email({ tlds: { allow: false } }).lowercase().trim().max(255).required()
    .messages({
      'string.email': 'Invalid email address',
      'any.required': 'Email is required'
    }),
  code:        Joi.string().length(6).pattern(/^\d+$/).required()
    .messages({
      'string.length':       'Reset code must be exactly 6 digits',
      'string.pattern.base': 'Reset code must contain digits only',
      'any.required':        'Reset code is required'
    }),
  newPassword: Joi.string().min(6).max(128).required()
    .messages({
      'string.min':   'New password must be at least 6 characters',
      'string.max':   'New password must not exceed 128 characters',
      'any.required': 'New password is required',
      'string.empty': 'New password cannot be empty'
    })
});

// ═══════════════════════════════════════════════════════════════════════════════
//  UPDATE PROFILE IMAGE SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════
const updateProfileImageSchema = Joi.object({
  userId: Joi.number().integer().positive().optional()
    .messages({ 'number.base': 'User ID must be a valid number' })
});

// ═══════════════════════════════════════════════════════════════════════════════
//  MIDDLEWARE FACTORY
// ═══════════════════════════════════════════════════════════════════════════════
function makeValidator(schema, opts = {}) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly:    false,
      stripUnknown:  true,
      ...opts
    });
    if (error) {
      const errors = error.details.map(d => d.message);
      return res.status(400).json({ success: false, errors });
    }
    req.validatedData = value;
    next();
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  REGISTER MIDDLEWARE — extra pre-processing needed
// ═══════════════════════════════════════════════════════════════════════════════
const validateRegister = (req, res, next) => {
  let body = { ...req.body };

  // 1. Normalise userType
  let rawType = (typeof body.userType === 'string' ? body.userType : '').toLowerCase();
  if (rawType === 'indigent') rawType = 'requester';
  body.userType = ['requester', 'donor', 'charity'].includes(rawType) ? rawType : body.userType;

  // 2. Parse nested location (sent as location[latitude], location[longitude] by multipart form)
  if (typeof body.location === 'string') {
    try { body.location = JSON.parse(body.location); } catch (_) {}
  }
  if (body.location && typeof body.location === 'object') {
    if (body.location.latitude  !== undefined) body.location.latitude  = parseFloat(body.location.latitude);
    if (body.location.longitude !== undefined) body.location.longitude = parseFloat(body.location.longitude);
  }

  // 3. Convert date strings
  if (body.birthDate   && typeof body.birthDate   === 'string') body.birthDate   = new Date(body.birthDate);
  if (body.charityDate && typeof body.charityDate === 'string') body.charityDate = new Date(body.charityDate);

  // 4. Trim string fields
  ['email', 'firstName', 'lastName', 'charityName', 'charityType', 'charityWebsite', 'charityFacebook', 'charityInstagram', 'charityLinkedIn', 'charityX'].forEach(k => {
    if (typeof body[k] === 'string') body[k] = body[k].trim();
  });

  // 5. Validate
  const { error, value } = registerSchema.validate(body, {
    abortEarly:   false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(d => d.message);
    return res.status(400).json({ success: false, errors });
  }

  req.validatedData = value;
  next();
};

// ═══════════════════════════════════════════════════════════════════════════════
//  FUNDRAISER CREATION SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════
const fundraiserSchema = Joi.object({
  fundraiserTitle: Joi.string()
    .trim()
    .min(5)
    .max(100)
    .required()
    .messages({
      'string.min': 'Fundraiser title must be at least 5 characters',
      'string.max': 'Fundraiser title must not exceed 100 characters',
      'any.required': 'Fundraiser title is required',
      'string.empty': 'Fundraiser title cannot be empty'
    }),

  fundraiserDescription: Joi.string()
    .trim()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description must not exceed 500 characters',
      'any.required': 'Description is required',
      'string.empty': 'Description cannot be empty'
    }),

  targetAmount: Joi.when('fundraiserType', {
    is: 'Fundraiser',
    then: Joi.number().min(1).max(999999999).required()
      .messages({
        'number.min': 'Target amount must be at least $1',
        'number.max': 'Target amount must not exceed $999,999,999',
        'any.required': 'Target amount is required for fundraiser campaigns',
        'number.base': 'Target amount must be a valid number'
      }),
    otherwise: Joi.number().min(1).max(999999999).optional().allow(null)
  }),

  categories: Joi.string()
    .required()
    .custom((value, helpers) => {
      try {
        const arr = JSON.parse(value);
        if (!Array.isArray(arr) || arr.length === 0) return helpers.error('array.min');
        if (arr.length > 4) return helpers.error('array.max');
        return value;
      } catch (e) {
        return helpers.error('string.json');
      }
    })
    .messages({
      'any.required': 'At least one category is required',
      'array.min': 'At least one category is required',
      'array.max': 'Maximum 4 categories allowed',
      'string.json': 'Invalid categories format'
    }),

  fundraiserType: Joi.string()
    .valid('Fundraiser', 'Donation')
    .default('Fundraiser')
    .messages({
      'any.only': 'Campaign type must be Fundraiser or Donation'
    }),

  fundraiserExpiryDate: Joi.date()
    .greater('now')
    .required()
    .messages({
      'date.base': 'Invalid expiry date',
      'date.greater': 'Expiry date must be in the future',
      'any.required': 'Expiry date is required'
    }),

  // Donation item fields (charity + donation only)
  donatedItemType: Joi.when('fundraiserType', {
    is: 'Donation',
    then: Joi.string().trim().max(100).required()
      .messages({
        'any.required': 'Donated item type is required',
        'string.max': 'Item type must not exceed 100 characters'
      }),
    otherwise: Joi.string().allow('', null).optional()
  }),

  otherDonationType: Joi.when('donatedItemType', {
    is: 'Other',
    then: Joi.string().trim().min(2).max(100).required()
      .messages({
        'string.min': 'Please specify the donation type (min 2 chars)',
        'string.max': 'Donation type must not exceed 100 characters',
        'any.required': 'Please specify the donation type'
      }),
    otherwise: Joi.string().allow('', null).optional()
  }),

  donatedItemQuantity: Joi.when('fundraiserType', {
    is: 'Donation',
    then: Joi.number().integer().min(1).max(999999).required()
      .messages({
        'number.base': 'Quantity must be a valid number',
        'number.integer': 'Quantity must be a whole number',
        'number.min': 'Quantity must be at least 1',
        'number.max': 'Quantity must not exceed 999,999',
        'any.required': 'Donated item quantity is required'
      }),
    otherwise: Joi.number().integer().min(1).max(999999).optional().allow(null)
  }),

  donatedItemCondition: Joi.when('fundraiserType', {
    is: 'Donation',
    then: Joi.string().valid('New', 'Excellent', 'Good', 'Fair').required()
      .messages({
      'any.only': 'Condition must be New, Excellent, Good, or Fair',
        'any.required': 'Item condition is required'
      }),
    otherwise: Joi.string().valid('New', 'Excellent', 'Good', 'Fair').optional().allow(null)
  }),

  // Fund allocation
  fundAllocationPct1: Joi.number().min(0).max(100).optional()
    .messages({ 'number.min': 'Percentage cannot be negative', 'number.max': 'Percentage cannot exceed 100' }),
  fundAllocationPct2: Joi.number().min(0).max(100).optional()
    .messages({ 'number.min': 'Percentage cannot be negative', 'number.max': 'Percentage cannot exceed 100' }),
  fundAllocationPct3: Joi.number().min(0).max(100).optional()
    .messages({ 'number.min': 'Percentage cannot be negative', 'number.max': 'Percentage cannot exceed 100' }),
  fundAllocationPct4: Joi.number().min(0).max(100).optional()
    .messages({ 'number.min': 'Percentage cannot be negative', 'number.max': 'Percentage cannot exceed 100' }),

  fundAllocationLabel1: Joi.string().trim().max(100).optional().allow(''),
  fundAllocationLabel2: Joi.string().trim().max(100).optional().allow(''),
  fundAllocationLabel3: Joi.string().trim().max(100).optional().allow(''),
  fundAllocationLabel4: Joi.string().trim().max(100).optional().allow(''),
  
    hashtags: Joi.string().max(500).required()
    .messages({
      'string.empty': 'Please add at least one hashtag',
      'any.required': 'Hashtags are required'
    }),
}).custom((value, helpers) => {
  // Validate fund allocation total = 100% when percentages are provided
  const pcts = [
    parseFloat(value.fundAllocationPct1) || 0,
    parseFloat(value.fundAllocationPct2) || 0,
    parseFloat(value.fundAllocationPct3) || 0,
    parseFloat(value.fundAllocationPct4) || 0
  ].filter(p => p > 0);
  
  if (pcts.length > 0) {
    const total = pcts.reduce((sum, p) => sum + p, 0);
    if (Math.abs(total - 100) > 0.01) {
      return helpers.error('fundAllocation.total');
    }
  }
  
  return value;
}).messages({
  'fundAllocation.total': 'Fund allocation percentages must sum to exactly 100%'
});

// ═══════════════════════════════════════════════════════════════════════════════
//  VERIFICATION REQUEST SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════
const verificationRequestSchema = Joi.object({
  fundraiserId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'Invalid fundraiser ID',
      'any.required': 'Fundraiser ID is required'
    }),

  userType: Joi.string().valid('Charity', 'requester').required()
    .messages({
      'any.only': 'User type must be Charity or requester',
      'any.required': 'User type is required'
    }),

  // Requester fields
  fullName: Joi.when('userType', {
    is: 'requester',
    then: Joi.string().trim().min(2).max(100).required()
      .messages({
        'string.min': 'Full name must be at least 2 characters',
        'string.max': 'Full name must not exceed 100 characters',
        'any.required': 'Full name is required'
      }),
    otherwise: Joi.string().allow('', null).optional()
  }),

  idNumber: Joi.when('userType', {
    is: 'requester',
    then: Joi.number().integer().min(1).max(999999999999).required()
      .messages({
        'number.base': 'ID number must be a valid number',
        'number.integer': 'ID number must be a whole number',
        'any.required': 'ID number is required'
      }),
    otherwise: Joi.number().optional().allow(null)
  }),

  currentAddress: Joi.when('userType', {
    is: 'requester',
    then: Joi.string().trim().min(5).max(500).required()
      .messages({
        'string.min': 'Address must be at least 5 characters',
        'string.max': 'Address must not exceed 500 characters',
        'any.required': 'Current address is required'
      }),
    otherwise: Joi.string().allow('', null).optional()
  }),

  // Charity fields
  charityFullName: Joi.when('userType', {
    is: 'Charity',
    then: Joi.string().trim().min(2).max(100).required()
      .messages({
        'string.min': 'Charity name must be at least 2 characters',
        'string.max': 'Charity name must not exceed 100 characters',
        'any.required': 'Charity full name is required'
      }),
    otherwise: Joi.string().allow('', null).optional()
  }),

  licenseNumber: Joi.when('userType', {
    is: 'Charity',
    then: Joi.number().integer().min(1).max(999999999999).required()
      .messages({
        'number.base': 'License number must be a valid number',
        'any.required': 'License number is required'
      }),
    otherwise: Joi.number().optional().allow(null)
  }),

  charityHeadquarters: Joi.when('userType', {
    is: 'Charity',
    then: Joi.string().trim().min(5).max(300).required()
      .messages({
        'string.min': 'Headquarters must be at least 5 characters',
        'string.max': 'Headquarters must not exceed 300 characters',
        'any.required': 'Charity headquarters is required'
      }),
    otherwise: Joi.string().allow('', null).optional()
  }),

  // Document validation (file presence checked at middleware level)
  needDocument: Joi.when('userType', {
    is: 'requester',
    then: Joi.any().required()
      .messages({
        'any.required': 'Document to prove need is required'
      }),
    otherwise: Joi.any().optional().allow(null)
  }),

  charityLicenseCertificate: Joi.when('userType', {
    is: 'Charity',
    then: Joi.any().required()
      .messages({
        'any.required': 'License certificate is required'
      }),
    otherwise: Joi.any().optional().allow(null)
  }),
});

// ═══════════════════════════════════════════════════════════════════════════════
//  ACHIEVEMENT CREATION SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════
const achievementSchema = Joi.object({
  fundraiserId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'Invalid fundraiser ID',
      'any.required': 'Fundraiser ID is required'
    }),

  achievementType: Joi.string()
    .valid('milestone', 'final')
    .required()
    .messages({
      'any.only': 'Achievement type must be milestone or final',
      'any.required': 'Achievement type is required'
    }),

  title: Joi.string()
    .trim()
    .min(5)
    .max(100)
    .required()
    .messages({
      'string.min': 'Title must be at least 5 characters',
      'string.max': 'Title must not exceed 100 characters',
      'any.required': 'Title is required',
      'string.empty': 'Title cannot be empty'
    }),

  description: Joi.string()
    .trim()
    .min(10)
    .max(5000)
    .required()
    .messages({
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description must not exceed 5000 characters',
      'any.required': 'Description is required',
      'string.empty': 'Description cannot be empty'
    }),

  achievementDate: Joi.date()
    .max('now')
    .optional()
    .allow(null)
    .messages({
      'date.max': 'Achievement date cannot be in the future'
    }),

  // Images are handled by multer; presence validated at middleware level
  mainImage: Joi.any().optional(),
  subImage1: Joi.any().optional(),
  subImage2: Joi.any().optional(),
  subImage3: Joi.any().optional(),
  achievementVideo: Joi.any().optional()
});
// ═══════════════════════════════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════
const validateLogin                = makeValidator(loginSchema);
const validateVerifyEmail          = makeValidator(verifyEmailSchema);
const validateUpdatePassword       = makeValidator(updatePasswordSchema);
const validateSendPasswordResetCode = makeValidator(sendPasswordResetCodeSchema);
const validateVerifyResetCode      = makeValidator(verifyResetCodeSchema);
const validateVerifyResetPassword  = makeValidator(verifyResetPasswordSchema);
const validateUpdateProfileImage   = makeValidator(updateProfileImageSchema);
const validateFundraiser = makeValidator(fundraiserSchema);
const validateVerificationRequest = makeValidator(verificationRequestSchema);
const validateAchievement = makeValidator(achievementSchema);


module.exports = {
  // schemas (exported for reuse / testing)
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  updatePasswordSchema,
  sendPasswordResetCodeSchema,
  verifyResetCodeSchema,
  verifyResetPasswordSchema,
  updateProfileImageSchema,
  fundraiserSchema,
  verificationRequestSchema,
  achievementSchema,

  // middleware
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateUpdatePassword,
  validateSendPasswordResetCode,
  validateVerifyResetCode,
  validateVerifyResetPassword,
  validateUpdateProfileImage,
  validateFundraiser,
  validateVerificationRequest,
  validateAchievement,
};

// // validations/auth_validation.js
// // Joi validation middleware — Firebase removed, Passport.js compatible

// const Joi = require('joi');

// // ═══════════════════════════════════════════════════════════════════════════════
// //  REGISTER SCHEMA
// // ═══════════════════════════════════════════════════════════════════════════════
// const registerSchema = Joi.object({

//   email: Joi.string()
//     .email({ tlds: { allow: false } })
//     .lowercase()
//     .trim()
//     .required()
//     .messages({
//       'string.email':    'البريد الإلكتروني غير صحيح',
//       'any.required':    'البريد الإلكتروني مطلوب'
//     }),

//   password: Joi.string()
//     .min(6)
//     .required()
//     .messages({
//       'string.min':   'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
//       'any.required': 'كلمة المرور مطلوبة'
//     }),

//   // confirmPassword is validated on the client; we just strip it server-side
//   confirmPassword: Joi.string().allow('', null).optional(),

//   // ── Donor / Indigent fields ────────────────────────────────────────────────
//   firstName: Joi.when('userType', {
//     not: 'charity',
//     then: Joi.string().trim().min(2).max(50).required()
//       .messages({
//         'string.min':   'الاسم الأول يجب أن يكون حرفين على الأقل',
//         'string.max':   'الاسم الأول يجب أن يكون 50 حرفاً كحد أقصى',
//         'any.required': 'الاسم الأول مطلوب'
//       }),
//     otherwise: Joi.string().allow('', null).optional()
//   }),

//   lastName: Joi.when('userType', {
//     not: 'charity',
//     then: Joi.string().trim().min(2).max(50).required()
//       .messages({
//         'string.min':   'اسم العائلة يجب أن يكون حرفين على الأقل',
//         'string.max':   'اسم العائلة يجب أن يكون 50 حرفاً كحد أقصى',
//         'any.required': 'اسم العائلة مطلوب'
//       }),
//     otherwise: Joi.string().allow('', null).optional()
//   }),

//   gender: Joi.when('userType', {
//     not: 'charity',
//     then: Joi.string()
//       .valid('male', 'female', 'Male', 'Female', 'MALE', 'FEMALE')
//       .required()
//       .messages({
//         'any.only':     'الجنس يجب أن يكون male أو female',
//         'any.required': 'الجنس مطلوب'
//       }),
//     otherwise: Joi.string()
//       .valid('male', 'female', 'Male', 'Female', 'MALE', 'FEMALE')
//       .optional()
//   }),

//   birthDate: Joi.when('userType', {
//     not: 'charity',
//     then: Joi.date().max('now').required()
//       .messages({
//         'date.base':    'تاريخ الميلاد غير صحيح',
//         'date.max':     'تاريخ الميلاد يجب أن يكون في الماضي',
//         'any.required': 'تاريخ الميلاد مطلوب'
//       }),
//     otherwise: Joi.date().max('now').optional()
//   }),

//   // ── Charity-specific fields ────────────────────────────────────────────────
//   charityName: Joi.when('userType', {
//     is: 'charity',
//     then: Joi.string().trim().min(2).required()
//       .messages({
//         'string.min':   'اسم الجمعية يجب أن يكون حرفين على الأقل',
//         'any.required': 'اسم الجمعية مطلوب'
//       }),
//     otherwise: Joi.string().allow('', null).optional()
//   }),

//   charityDescription: Joi.when('userType', {
//     is: 'charity',
//     then: Joi.string().max(500).required()
//       .messages({
//         'string.max':   'الوصف يجب أن لا يتجاوز 500 حرف',
//         'any.required': 'وصف الجمعية مطلوب'
//       }),
//     otherwise: Joi.string().allow('', null).optional()
//   }),

//   charityDate: Joi.when('userType', {
//     is: 'charity',
//     then: Joi.date().max('now').required()
//       .messages({
//         'date.base':    'تاريخ التأسيس غير صحيح',
//         'date.max':     'تاريخ التأسيس يجب أن يكون في الماضي',
//         'any.required': 'تاريخ التأسيس مطلوب'
//       }),
//     otherwise: Joi.date().allow(null).optional()
//   }),

//   charityType: Joi.when('userType', {
//     is: 'charity',
//     then: Joi.string().trim().required()
//       .messages({ 'any.required': 'نوع الجمعية مطلوب' }),
//     otherwise: Joi.string().allow('', null).optional()
//   }),

//   // ── Phone ──────────────────────────────────────────────────────────────────
//   full_phone_number: Joi.string()
//     .pattern(/^\+?[1-9]\d{1,14}$/)
//     .required()
//     .messages({
//       'string.pattern.base': 'رقم الهاتف الكامل غير صحيح',
//       'any.required':        'رقم الهاتف مطلوب'
//     }),

//   phone_number: Joi.string().optional().allow('', null),
//   phone_code:   Joi.string().optional().allow('', null),
//   phone_national: Joi.string().max(30).optional().allow(''),
//   phone_international: Joi.string().max(30).optional().allow(''),
//   phone_country_iso: Joi.string().length(2).optional().allow(''),
//   // phone_country_name can be ignored or added if you want it
//   // ── Location ───────────────────────────────────────────────────────────────
//   location: Joi.object({
//     latitude: Joi.alternatives().try(
//       Joi.number().min(-90).max(90),
//       Joi.string().pattern(/^-?\d+\.?\d*$/).custom((value, helpers) => {
//         const num = parseFloat(value);
//         if (isNaN(num) || num < -90 || num > 90) return helpers.error('number.range');
//         return num;
//       })
//     ).required()
//       .messages({
//         'any.required':  'خط العرض مطلوب',
//         'number.range':  'خط العرض يجب أن يكون بين -90 و 90'
//       }),
//     longitude: Joi.alternatives().try(
//       Joi.number().min(-180).max(180),
//       Joi.string().pattern(/^-?\d+\.?\d*$/).custom((value, helpers) => {
//         const num = parseFloat(value);
//         if (isNaN(num) || num < -180 || num > 180) return helpers.error('number.range');
//         return num;
//       })
//     ).required()
//       .messages({
//         'any.required':  'خط الطول مطلوب',
//         'number.range':  'خط الطول يجب أن يكون بين -180 و 180'
//       })
//   }).required()
//     .messages({ 'any.required': 'الموقع مطلوب' }),

//   // ── User type ──────────────────────────────────────────────────────────────
//   userType: Joi.string()
//     .valid('requester', 'donor', 'charity')
//     .required()
//     .messages({
//       'any.only':     'نوع المستخدم يجب أن يكون requester, donor أو charity',
//       'any.required': 'نوع المستخدم مطلوب'
//     }),
// });

// // ═══════════════════════════════════════════════════════════════════════════════
// //  LOGIN SCHEMA  (email + password, validated before passport.authenticate)
// // ═══════════════════════════════════════════════════════════════════════════════
// const loginSchema = Joi.object({
//   email: Joi.string()
//     .email({ tlds: { allow: false } })
//     .lowercase()
//     .trim()
//     .required()
//     .messages({
//       'string.email':    'البريد الإلكتروني غير صحيح',
//       'any.required':    'البريد الإلكتروني مطلوب'
//     }),
//   password: Joi.string().required()
//     .messages({ 'any.required': 'كلمة المرور مطلوبة' })
// });

// // ═══════════════════════════════════════════════════════════════════════════════
// //  VERIFY EMAIL SCHEMA
// // ═══════════════════════════════════════════════════════════════════════════════
// const verifyEmailSchema = Joi.object({
//   email: Joi.string()
//     .email({ tlds: { allow: false } })
//     .lowercase()
//     .trim()
//     .required()
//     .messages({
//       'string.email':    'البريد الإلكتروني غير صحيح',
//       'any.required':    'البريد الإلكتروني مطلوب'
//     }),
//   verifyCode: Joi.string().length(6).pattern(/^\d+$/).required()
//     .messages({
//       'string.length':       'رمز التحقق يجب أن يكون 6 أرقام',
//       'string.pattern.base': 'رمز التحقق يجب أن يحتوي على أرقام فقط',
//       'any.required':        'رمز التحقق مطلوب'
//     })
// });

// // ═══════════════════════════════════════════════════════════════════════════════
// //  UPDATE PASSWORD SCHEMA  (authenticated user changing their own password)
// // ═══════════════════════════════════════════════════════════════════════════════
// const updatePasswordSchema = Joi.object({
//   currentPassword: Joi.string().required()
//     .messages({ 'any.required': 'كلمة المرور الحالية مطلوبة' }),
//   newPassword: Joi.string().min(6).required()
//     .messages({
//       'string.min':   'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل',
//       'any.required': 'كلمة المرور الجديدة مطلوبة'
//     })
// });

// // ═══════════════════════════════════════════════════════════════════════════════
// //  PASSWORD RESET SCHEMAS
// // ═══════════════════════════════════════════════════════════════════════════════
// const sendPasswordResetCodeSchema = Joi.object({
//   email: Joi.string()
//     .email({ tlds: { allow: false } })
//     .lowercase()
//     .trim()
//     .required()
//     .messages({
//       'string.email':    'البريد الإلكتروني غير صحيح',
//       'any.required':    'البريد الإلكتروني مطلوب'
//     })
// });

// const verifyResetCodeSchema = Joi.object({
//   email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim().required(),
//   code:  Joi.string().length(6).pattern(/^\d+$/).required()
// });

// const verifyResetPasswordSchema = Joi.object({
//   email:       Joi.string().email({ tlds: { allow: false } }).lowercase().trim().required(),
//   code:        Joi.string().length(6).pattern(/^\d+$/).required(),
//   newPassword: Joi.string().min(6).required()
//     .messages({
//       'string.min':   'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل',
//       'any.required': 'كلمة المرور الجديدة مطلوبة'
//     })
// });

// // ═══════════════════════════════════════════════════════════════════════════════
// //  UPDATE PROFILE IMAGE SCHEMA
// // ═══════════════════════════════════════════════════════════════════════════════
// const updateProfileImageSchema = Joi.object({
//   userId: Joi.number().integer().optional() // optional — we prefer req.user.id
// });

// // ═══════════════════════════════════════════════════════════════════════════════
// //  MIDDLEWARE FACTORY
// // ═══════════════════════════════════════════════════════════════════════════════
// function makeValidator(schema, opts = {}) {
//   return (req, res, next) => {
//     const { error, value } = schema.validate(req.body, {
//       abortEarly:    false,
//       stripUnknown:  true,
//       ...opts
//     });
//     if (error) {
//       const errors = error.details.map(d => d.message);
//       return res.status(400).json({ success: false, errors });
//     }
//     req.validatedData = value;
//     next();
//   };
// }

// // ═══════════════════════════════════════════════════════════════════════════════
// //  REGISTER MIDDLEWARE — extra pre-processing needed
// // ═══════════════════════════════════════════════════════════════════════════════
// const validateRegister = (req, res, next) => {
//   let body = { ...req.body };

//   // 1. Normalise userType
//   let rawType = (typeof body.userType === 'string' ? body.userType : '').toLowerCase();
//   if (rawType === 'indigent') rawType = 'requester';
//   body.userType = ['requester', 'donor', 'charity'].includes(rawType) ? rawType : body.userType;

//   // 2. Parse nested location (sent as location[latitude], location[longitude] by multipart form)
//   if (typeof body.location === 'string') {
//     try { body.location = JSON.parse(body.location); } catch (_) {}
//   }
//   if (body.location && typeof body.location === 'object') {
//     if (body.location.latitude  !== undefined) body.location.latitude  = parseFloat(body.location.latitude);
//     if (body.location.longitude !== undefined) body.location.longitude = parseFloat(body.location.longitude);
//   }

//   // 3. Convert date strings
//   if (body.birthDate   && typeof body.birthDate   === 'string') body.birthDate   = new Date(body.birthDate);
//   if (body.charityDate && typeof body.charityDate === 'string') body.charityDate = new Date(body.charityDate);

//   // 4. Validate
//   const { error, value } = registerSchema.validate(body, {
//     abortEarly:   false,
//     stripUnknown: true
//   });

//   if (error) {
//     const errors = error.details.map(d => d.message);
//     return res.status(400).json({ success: false, errors });
//   }

//   req.validatedData = value;
//   next();
// };

// // ═══════════════════════════════════════════════════════════════════════════════
// //  EXPORTS
// // ═══════════════════════════════════════════════════════════════════════════════
// const validateLogin                = makeValidator(loginSchema);
// const validateVerifyEmail          = makeValidator(verifyEmailSchema);
// const validateUpdatePassword       = makeValidator(updatePasswordSchema);
// const validateSendPasswordResetCode = makeValidator(sendPasswordResetCodeSchema);
// const validateVerifyResetCode      = makeValidator(verifyResetCodeSchema);
// const validateVerifyResetPassword  = makeValidator(verifyResetPasswordSchema);
// const validateUpdateProfileImage   = makeValidator(updateProfileImageSchema);

// module.exports = {
//   // schemas (exported for reuse / testing)
//   registerSchema,
//   loginSchema,
//   verifyEmailSchema,
//   updatePasswordSchema,
//   sendPasswordResetCodeSchema,
//   verifyResetCodeSchema,
//   verifyResetPasswordSchema,
//   updateProfileImageSchema,

//   // middleware
//   validateRegister,
//   validateLogin,
//   validateVerifyEmail,
//   validateUpdatePassword,
//   validateSendPasswordResetCode,
//   validateVerifyResetCode,
//   validateVerifyResetPassword,
//   validateUpdateProfileImage
// };