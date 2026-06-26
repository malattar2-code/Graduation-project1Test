const Joi = require('joi');

// ================================
// مخطط التحقق من بيانات التسجيل
// ================================
const registerSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'البريد الإلكتروني غير صحيح',
      'any.required': 'البريد الإلكتروني مطلوب'
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
      'any.required': 'كلمة المرور مطلوبة'
    }),

  // Conditional: required only for non‑charity
  firstName: Joi.when('userType', {
    not: 'charity',
    then: Joi.string().trim().min(2).max(50).required()
      .messages({
        'string.min': 'الاسم الأول يجب أن يكون حرفين على الأقل',
        'string.max': 'الاسم الأول يجب أن يكون 50 حرفاً كحد أقصى',
        'any.required': 'الاسم الأول مطلوب'
      }),
    otherwise: Joi.string().allow('', null).optional()
  }),

  lastName: Joi.when('userType', {
    not: 'charity',
    then: Joi.string().trim().min(2).max(50).required()
      .messages({
        'string.min': 'اسم العائلة يجب أن يكون حرفين على الأقل',
        'string.max': 'اسم العائلة يجب أن يكون 50 حرفاً كحد أقصى',
        'any.required': 'اسم العائلة مطلوب'
      }),
    otherwise: Joi.string().allow('', null).optional()
  }),

  gender: Joi.when('userType', {
    not: 'charity',
    then: Joi.string().valid('male', 'female', 'Male', 'Female', 'MALE', 'FEMALE').required()
      .messages({
        'any.only': 'الجنس يجب أن يكون male أو female',
        'any.required': 'الجنس مطلوب'
      }),
    otherwise: Joi.string().valid('male', 'female', 'Male', 'Female', 'MALE', 'FEMALE').optional()
  }),

  birthDate: Joi.when('userType', {
    not: 'charity',
    then: Joi.date().max('now').required()
      .messages({
        'date.base': 'تاريخ الميلاد غير صحيح',
        'date.max': 'تاريخ الميلاد يجب أن يكون في الماضي',
        'any.required': 'تاريخ الميلاد مطلوب'
      }),
    otherwise: Joi.date().max('now').optional()
  }),

  // Charity‑specific fields (required only for charity)
  charityName: Joi.when('userType', {
    is: 'charity',
    then: Joi.string().trim().min(2).required()
      .messages({
        'string.min': 'اسم الجمعية يجب أن يكون حرفين على الأقل',
        'any.required': 'اسم الجمعية مطلوب'
      }),
    otherwise: Joi.string().allow('', null).optional()
  }),

  charityDescription: Joi.when('userType', {
    is: 'charity',
    then: Joi.string().max(500).required()
      .messages({
        'string.max': 'الوصف يجب أن لا يتجاوز 500 حرف',
        'any.required': 'وصف الجمعية مطلوب'
      }),
    otherwise: Joi.string().allow('', null).optional()
  }),

  charityDate: Joi.when('userType', {
    is: 'charity',
    then: Joi.date().max('now').required()
      .messages({
        'date.base': 'تاريخ التأسيس غير صحيح',
        'date.max': 'تاريخ التأسيس يجب أن يكون في الماضي',
        'any.required': 'تاريخ التأسيس مطلوب'
      }),
    otherwise: Joi.date().allow(null).optional()
  }),

  charityType: Joi.when('userType', {
    is: 'charity',
    then: Joi.string().trim().required()
      .messages({ 'any.required': 'نوع الجمعية مطلوب' }),
    otherwise: Joi.string().allow('', null).optional()
  }),

  // Full phone number (sent from both forms)
  full_phone_number: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'رقم الهاتف الكامل غير صحيح',
      'any.required': 'رقم الهاتف مطلوب'
    }),

  // Optional phone fields (still sent by the intl‑tel‑input)
  phone_number: Joi.string().optional().allow('', null),
  phone_code: Joi.string().optional().allow('', null),

  // Location – now required for ALL user types (both forms send it as nested object)
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
        'number.base': 'خط العرض يجب أن يكون رقماً',
        'number.min': 'خط العرض يجب أن يكون بين -90 و 90',
        'number.max': 'خط العرض يجب أن يكون بين -90 و 90',
        'any.required': 'خط العرض مطلوب',
        'number.range': 'خط العرض يجب أن يكون بين -90 و 90'
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
        'number.base': 'خط الطول يجب أن يكون رقماً',
        'number.min': 'خط الطول يجب أن يكون بين -180 و 180',
        'number.max': 'خط الطول يجب أن يكون بين -180 و 180',
        'any.required': 'خط الطول مطلوب',
        'number.range': 'خط الطول يجب أن يكون بين -180 و 180'
      })
  }).required()
    .messages({ 'any.required': 'الموقع مطلوب' }),

  userType: Joi.string()
    .valid('requester', 'donor', 'charity')
    .required()
    .messages({
      'any.only': 'نوع المستخدم يجب أن يكون requester, donor أو charity',
      'any.required': 'نوع المستخدم مطلوب'
    }),
});

// ================================
// Middleware الخاصة بالتحقق
// ================================
const validateRegister = (req, res, next) => {
  let body = { ...req.body };

  // 1. Normalise userType
  let rawType = (typeof body.userType === 'string' ? body.userType : '').toLowerCase();
  if (rawType === 'indigent') rawType = 'requester';
  if (['requester', 'donor', 'charity'].includes(rawType)) {
    body.userType = rawType;
  } else {
    body.userType = body.userType || '';
  }

  // 2. Parse location if it came as a string (should not happen with multer, but safe)
  if (typeof body.location === 'string') {
    try { body.location = JSON.parse(body.location); } catch (e) {}
  }
  // Ensure coordinates are numbers
  if (body.location && typeof body.location === 'object') {
    if (body.location.latitude) body.location.latitude = parseFloat(body.location.latitude);
    if (body.location.longitude) body.location.longitude = parseFloat(body.location.longitude);
  }

  // 3. Convert birthDate string to Date if present
  if (body.birthDate && typeof body.birthDate === 'string')
    body.birthDate = new Date(body.birthDate);

  // 4. Joi validation
  const { error, value } = registerSchema.validate(body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({ success: false, errors });
  }

  // 5. Pass validated data
  req.validatedData = value;
  next();
};

// ================================
// باقي الدوال بدون تغيير
// ================================
const loginSchema = Joi.object({
  idToken: Joi.string().required().messages({ 'any.required': 'رمز التوكن مطلوب' })
});

const verifyEmailSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required()
    .messages({ 'string.email': 'البريد الإلكتروني غير صحيح', 'any.required': 'البريد الإلكتروني مطلوب' }),
  verifyCode: Joi.string().length(6).pattern(/^[0-9]+$/).required()
    .messages({ 'string.length': 'رمز التحقق يجب أن يكون 6 أرقام', 'string.pattern.base': 'رمز التحقق يجب أن يحتوي على أرقام فقط', 'any.required': 'رمز التحقق مطلوب' })
});

const updatePasswordSchema = Joi.object({
  uid: Joi.string().required().messages({ 'any.required': 'معرف المستخدم (uid) مطلوب' }),
  newPassword: Joi.string().min(6).required().messages({ 'string.min': 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل', 'any.required': 'كلمة المرور الجديدة مطلوبة' })
});

const sendPasswordResetCodeSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({ 'string.email': 'البريد الإلكتروني غير صحيح', 'any.required': 'البريد الإلكتروني مطلوب' })
});

const verifyResetCodeSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  code: Joi.string().length(6).pattern(/^[0-9]+$/).required()
});

const verifyResetPasswordSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  code: Joi.string().length(6).pattern(/^[0-9]+$/).required(),
  newPassword: Joi.string().min(6).required()
});

const updateProfileImageSchema = Joi.object({
  uid: Joi.string().required().messages({ 'any.required': 'معرف المستخدم (uid) مطلوب' })
});

const validateLogin = (req, res, next) => {
  const { error, value } = loginSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, errors: error.details.map(d => d.message) });
  req.validatedData = value;
  next();
};

const validateVerifyEmail = (req, res, next) => {
  const { error, value } = verifyEmailSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, errors: error.details.map(d => d.message) });
  req.validatedData = value;
  next();
};

const validateUpdatePassword = (req, res, next) => {
  const { error, value } = updatePasswordSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, errors: error.details.map(d => d.message) });
  req.validatedData = value;
  next();
};

const validateSendPasswordResetCode = (req, res, next) => {
  const { error, value } = sendPasswordResetCodeSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, errors: error.details.map(d => d.message) });
  req.validatedData = value;
  next();
};

const validateVerifyResetCode = (req, res, next) => {
  const { error, value } = verifyResetCodeSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, errors: error.details.map(d => d.message) });
  req.validatedData = value;
  next();
};

const validateVerifyResetPassword = (req, res, next) => {
  const { error, value } = verifyResetPasswordSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, errors: error.details.map(d => d.message) });
  req.validatedData = value;
  next();
};

const validateUpdateProfileImage = (req, res, next) => {
  const { error, value } = updateProfileImageSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ success: false, errors: error.details.map(d => d.message) });
  if (!req.file) return res.status(400).json({ success: false, errors: ['يجب رفع صورة'] });
  req.validatedData = value;
  next();
};

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  updatePasswordSchema,
  sendPasswordResetCodeSchema,
  verifyResetCodeSchema,
  verifyResetPasswordSchema,
  updateProfileImageSchema,

  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateUpdatePassword,
  validateSendPasswordResetCode,
  validateVerifyResetCode,
  validateVerifyResetPassword,
  validateUpdateProfileImage
};