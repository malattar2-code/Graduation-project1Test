const Fundraiser = require('../../models/Fundraiser');
const Category   = require('../../models/Category');
const User       = require('../../models/User');
const Hashtag    = require('../../models/Hashtag');
const path       = require("path");
const fs         = require("fs");
const { getLocationFromCoordinates } = require('../../utils/geolocation');
const FundraisersVerificationRequest = require('../../models/FundraisersVerificationRequest');
const FundraiserAchievement = require('../../models/FundraiserAchievement');
const TransferLog = require('../../models/TransferLog');

// ─── DB helpers ───────────────────────────────────────────────────────────────
async function getDatabaseUserWithLocation(req) {
  try {
    if (!req.user?.id) return null;
    const dbUser = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'full_name', 'location', 'user_type',
                   'phone_number','phone_international', 'phone_national', 'phone_country_iso', 'gender', 'birth_date', 'user_image',
                   'charity_name', 'charity_description', 'charity_establishment_date',
                   'charity_type']
    });
    if (!dbUser) return null;

    const formattedBirthDate = dbUser.birth_date
      ? new Date(dbUser.birth_date).toLocaleDateString('en-US') : null;

    let userLocationString = 'Unknown Location';
    if (dbUser.location) {
      try {
        userLocationString = await getLocationFromCoordinates(dbUser.location);
      } catch { 
        userLocationString = 'Location error'; 
      }
    }

        return { ...dbUser.toJSON(), userLocationString, formattedBirthDate };
  } catch (e) { console.error('getDatabaseUserWithLocation error:', e); return null; }
}

async function uploadImage(imageFile) {
  const uploadDir = path.join(__dirname, "../../public/uploads/fundraisers");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const fileName = `fundraiser-${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(imageFile.originalname)}`;
  await fs.promises.writeFile(path.join(uploadDir, fileName), imageFile.buffer);
  return `/uploads/fundraisers/${fileName}`;
}

function buildTemplateUser(dbUser) {
  return {
    id:         dbUser.id,
    email:      dbUser.email,
    name:       dbUser.full_name || 'User',
    full_name:  dbUser.full_name || 'User',
    user_type:  dbUser.user_type,
    phone_number: dbUser.phone_number,
    phone_international: dbUser.phone_international || null,
    phone_national:      dbUser.phone_national      || null,
    phone_country_iso:   dbUser.phone_country_iso   || null,
    gender:     dbUser.gender,
    birth_date: dbUser.formattedBirthDate || dbUser.birth_date,
    raw_birth_date: dbUser.birth_date,
    user_image: dbUser.user_image || null,
    charity_name:               dbUser.charity_name               || null,
    charity_description:        dbUser.charity_description        || null,
    charity_establishment_date: dbUser.charity_establishment_date || null,
    charity_type:               dbUser.charity_type               || null
  };
}

class UserPanelIndigentController {
  // GET /userPanelIndigent
  async getUserPanel(req, res) {
    try {
      console.log('🚀 Loading userPanelIndigent — user ID:', req.user?.id);

      const dbUser = await getDatabaseUserWithLocation(req);
      const categories = await Category.findAll({
        attributes: ['category_id', 'category_name'],
        order: [['category_name', 'ASC']]
      });

      if (!dbUser) {
        return res.render('dashboard/user-panel-indigent', {
          fundraisers: [], categories, title: 'My Fundraisers',
          user: null, userLocation: 'Unknown Location',
          successMessage: null,
          errorMessage: 'User not found. Please complete your registration.'
        });
      }

      const fundraisers = await Fundraiser.findAll({
        where: { fundraiser_user_id: dbUser.id, is_blocked: false },
        order: [['created_at', 'DESC']]
      });
      // Fetch achievements for each fundraiser to check if milestone/final already created
      const fundraiserIds = fundraisers.map(f => f.fundraiser_id);
      
      // Fetch completed transfers with withdrawal_type for each fundraiser
      const completedTransfers = await TransferLog.findAll({
        where: {
          fundraiser_id: fundraiserIds,
          status: 'completed'
        },
        attributes: ['fundraiser_id', 'withdrawal_type', 'status']
      });

      // Fetch existing achievements
      const existingAchievements = await FundraiserAchievement.findAll({
        where: {
          fundraiser_id: fundraiserIds
        },
        attributes: ['fundraiser_id', 'achievement_type']
      });

      // Build lookup maps
      const transferMap = {};
      completedTransfers.forEach(t => {
        transferMap[t.fundraiser_id] = t.withdrawal_type;
      });

      const achievementMap = {};
      existingAchievements.forEach(a => {
        if (!achievementMap[a.fundraiser_id]) {
          achievementMap[a.fundraiser_id] = [];
        }
        achievementMap[a.fundraiser_id].push(a.achievement_type);
      });

      // Attach flags to each fundraiser object
      fundraisers.forEach(f => {
        f.hasCompletedEarlyTransfer = transferMap[f.fundraiser_id] === 'early';
        f.hasCompletedFinalTransfer = transferMap[f.fundraiser_id] === 'final';
        f.hasMilestoneAchievement = achievementMap[f.fundraiser_id]?.includes('milestone') || false;
        f.hasFinalAchievement = achievementMap[f.fundraiser_id]?.includes('final') || false;
      });
      for (const f of fundraisers) {
        if (
          f.fundraiser_type === 'Fundraiser' &&
          f.fundraiser_status === 'incompleted' &&
          parseFloat(f.fundraiser_target_amount) > 0 &&
          parseFloat(f.fundraiser_collected_amount) >= parseFloat(f.fundraiser_target_amount)
        ) {
          // Charity users go to create_form; requester users go to completed
          const newStatus = (dbUser.user_type === 'Charity') ? 'create_form' : 'completed';
          await Fundraiser.update(
            { fundraiser_status: newStatus },
            { where: { fundraiser_id: f.fundraiser_id }, hooks: false }
          );
          f.fundraiser_status = newStatus;
        }
      }

      const fundraisersWithProgress = fundraisers.map(f => {
        const collected = parseFloat(f.fundraiser_collected_amount) || 0;
        const target    = parseFloat(f.fundraiser_target_amount)    || 0;
        const progress  = target > 0 ? Math.min((collected / target) * 100, 100) : 0;
        return {
          ...f.toJSON(),
          progress:      Math.round(progress),
          progressWidth: `${progress}%`,
          hasCompletedEarlyTransfer: f.hasCompletedEarlyTransfer,
          hasCompletedFinalTransfer: f.hasCompletedFinalTransfer,
          hasMilestoneAchievement: f.hasMilestoneAchievement,
          hasFinalAchievement: f.hasFinalAchievement
        };
      });

      console.log(`✅ ${fundraisers.length} fundraisers loaded for user ${dbUser.id}`);

      res.render('dashboard/user-panel-indigent', {
        fundraisers: fundraisersWithProgress,
        categories,
        title:          'My Fundraisers',
        user:           buildTemplateUser(dbUser),
        userLocation:   dbUser.userLocationString || 'Unknown Location',
        successMessage: req.query.success ? 'Fundraiser created successfully!' : null,
        errorMessage:   req.query.error   || null
      });

    } catch (error) {
      console.error('💥 Error loading user panel:', error);
      const categories = await Category.findAll({ attributes: ['category_id', 'category_name'], order: [['category_name', 'ASC']] });
      res.render('dashboard/user-panel-indigent', {
        fundraisers: [], categories, title: 'My Fundraisers',
        user: null, userLocation: 'Unknown Location',
        successMessage: null, errorMessage: 'Error loading page: ' + error.message
      });
    }
  }

  // POST /userPanelIndigent — create fundraiser
  async createFundraiser(req, res) {
    try {
      const dbUser = await getDatabaseUserWithLocation(req);
      const categories = await Category.findAll({ attributes: ['category_id', 'category_name'], order: [['category_name', 'ASC']] });

      if (!dbUser) {
        return res.render('dashboard/user-panel-indigent', {
          fundraisers: [], categories, title: 'My Fundraisers',
          user: null, userLocation: 'Unknown Location',
          successMessage: null, errorMessage: 'User not authenticated. Please log in again.'
        });
      }

      const userId = dbUser.id;
      const {
        fundraiserTitle,
        targetAmount,
        categories: categoriesJson,
        fundraiserDescription,
        fundraiserType,
        fundraiserExpiryDate,
        donatedItemType,
        donatedItemQuantity,
        donatedItemCondition,
        fundAllocationPct1,
        fundAllocationPct2,
        fundAllocationPct3,
        fundAllocationPct4,
        fundAllocationLabel1,
        fundAllocationLabel2,
        fundAllocationLabel3,
        fundAllocationLabel4,
        otherDonationType
      } = req.body;
      const fType = (fundraiserType === 'Donation') ? 'Donation' : 'Fundraiser';
      const missing = [];
      if (!fundraiserTitle)      missing.push('title');
      if (!categoriesJson)       missing.push('categories');
      if (!fundraiserDescription) missing.push('description');
      if (fType === 'Fundraiser' && !targetAmount) missing.push('target amount');

      // ── Essential fields: expiry date ──
      if (!fundraiserExpiryDate) missing.push('expiry date');

      // ── Charity + Donation: donation item fields ──
      const isCharity = dbUser.user_type === 'Charity';
      const finalDonatedItemType = (isCharity && fType === 'Donation')
        ? (donatedItemType === 'Other' ? (otherDonationType || '') : donatedItemType)
        : 'Money';

      if (isCharity && fType === 'Donation') {
        if (!finalDonatedItemType) missing.push('donated item type');
        if (!donatedItemQuantity)  missing.push('donated item quantity');
        if (!donatedItemCondition) missing.push('donated item condition');
      }

      // ── Charity: fund allocation percentages ──
      let fundAllocationPercentage = null;
      if (isCharity) {
        const shouldValidatePercentages =
          (fType === 'Fundraiser') ||
          (fType === 'Donation' && finalDonatedItemType === 'Money');

        if (shouldValidatePercentages) {
          const percentages = [
            parseFloat(fundAllocationPct1) || 0,
            parseFloat(fundAllocationPct2) || 0,
            parseFloat(fundAllocationPct3) || 0,
            parseFloat(fundAllocationPct4) || 0
          ].filter(p => p > 0);

          // ── Reject negative percentages ──
          if (percentages.some(p => p < 0)) {
            missing.push('fund allocation percentages cannot be negative');
          } else {
            if (percentages.length < 1) {
              missing.push('at least 1 fund allocation percentage');
            } else {
              const total = percentages.reduce((sum, p) => sum + p, 0);
              if (Math.abs(total - 100) > 0.01) {
                missing.push('fund allocation percentages must sum to 100%');
              } else {
                const labels = [fundAllocationLabel1, fundAllocationLabel2, fundAllocationLabel3, fundAllocationLabel4];
                fundAllocationPercentage = percentages.map((pct, idx) => ({
                  label: labels[idx] || `Allocation ${idx + 1}`,
                  percentage: pct
                }));
              }
            }
          }
        }
      }

      // ── Expiry date validation ──
      if (fundraiserExpiryDate) {
        const createdDate = new Date();
        const expiryDate = new Date(fundraiserExpiryDate);
        const minDays = 7;
        const maxDays = isCharity ? 180 : 90;
        const minDate = new Date(createdDate);
        minDate.setDate(minDate.getDate() + minDays);
        const maxDate = new Date(createdDate);
        maxDate.setDate(maxDate.getDate() + maxDays);

        if (expiryDate < minDate || expiryDate > maxDate) {
          missing.push(`expiry date must be between ${minDays} and ${maxDays} days from today`);
        }
      }

      if (missing.length) {
        const fundraisers = await Fundraiser.findAll({ where: { fundraiser_user_id: userId, is_blocked: false }, order: [['created_at', 'DESC']] });
        return res.render('dashboard/user-panel-indigent', {
          errorMessage: `Please fill in: ${missing.join(', ')}.`,
          categories, fundraisers, user: buildTemplateUser(dbUser),
          userLocation: dbUser.userLocationString || 'Unknown Location',
          title: 'My Fundraisers', successMessage: null
        });
      }

      const contentModerator = require('../../services/contentModeratorService');
      const titleViol = await contentModerator.checkText(fundraiserTitle);
      const descViol  = await contentModerator.checkText(fundraiserDescription);
      const allViol   = [...titleViol, ...descViol];
      const blocked   = allViol.some(v => v.level === 'high');
      const blockReason = blocked
        ? `Automatically blocked: ${allViol.map(v => v.message).join(', ')}` : null;

      const mainImagePath = req.files?.mainImage ? await uploadImage(req.files.mainImage[0]) : null;
      if (!mainImagePath) {
        const fundraisers = await Fundraiser.findAll({ where: { fundraiser_user_id: userId, is_blocked: false }, order: [['created_at', 'DESC']] });
        return res.render('dashboard/user-panel-indigent', {
          errorMessage: 'Main image is required.',
          categories, fundraisers, user: buildTemplateUser(dbUser),
          userLocation: dbUser.userLocationString || 'Unknown Location',
          title: 'My Fundraisers', successMessage: null
        });
      }

      const subImages = [];
      if (req.files?.subImage1) subImages.push(await uploadImage(req.files.subImage1[0]));
      if (req.files?.subImage2) subImages.push(await uploadImage(req.files.subImage2[0]));
      if (req.files?.subImage3) subImages.push(await uploadImage(req.files.subImage3[0]));

      // ── Video upload ──
      let videoPath = null;
      if (req.files?.fundraiserVideo) {
        videoPath = await uploadImage(req.files.fundraiserVideo[0]);
      }

      let categoriesArray;
      try {
        categoriesArray = JSON.parse(categoriesJson);
        if (!Array.isArray(categoriesArray) || categoriesArray.length === 0)
          throw new Error('At least one category is required');
        if (categoriesArray.length > 4)
          throw new Error('Maximum 4 categories allowed');
      } catch (e) {
        const fundraisers = await Fundraiser.findAll({ where: { fundraiser_user_id: userId, is_blocked: false }, order: [['created_at', 'DESC']] });
        return res.render('dashboard/user-panel-indigent', {
          errorMessage: e.message, categories, fundraisers,
          user: buildTemplateUser(dbUser),
          userLocation: dbUser.userLocationString || 'Unknown Location',
          title: 'My Fundraisers', successMessage: null
        });
      }

      let hashtagsArray = [];
      try {
        const rawHashtags = req.body.hashtags || '[]';
        const parsed = typeof rawHashtags === 'string' ? JSON.parse(rawHashtags) : rawHashtags;
        hashtagsArray = Array.isArray(parsed) ? parsed.map(t => 
            typeof t === 'string' ? t.toLowerCase().trim().replace(/^#/, '') : t.value?.toLowerCase().trim().replace(/^#/, '')
        ).filter(Boolean) : [];
      } catch (e) {
        hashtagsArray = [];
      }

      if (hashtagsArray.length < 1) {
        const fundraisers = await Fundraiser.findAll({ where: { fundraiser_user_id: userId, is_blocked: false }, order: [['created_at', 'DESC']] });
        return res.render('dashboard/user-panel-indigent', {
          errorMessage: 'At least one hashtag is required.',
          categories, fundraisers,
          user: buildTemplateUser(dbUser),
          userLocation: dbUser.userLocationString || 'Unknown Location',
          title: 'My Fundraisers', successMessage: null
        });
      }
      if (hashtagsArray.length > 10) {
        const fundraisers = await Fundraiser.findAll({ where: { fundraiser_user_id: userId, is_blocked: false }, order: [['created_at', 'DESC']] });
        return res.render('dashboard/user-panel-indigent', {
          errorMessage: 'Maximum 10 hashtags allowed.',
          categories, fundraisers,
          user: buildTemplateUser(dbUser),
          userLocation: dbUser.userLocationString || 'Unknown Location',
          title: 'My Fundraisers', successMessage: null
        });
      }

      const initialStatus = 'waiting_verification';

        const finalDonatedItemTypeValue = (isCharity && fType === 'Donation')
        ? (donatedItemType === 'Other' ? (otherDonationType || 'Other') : donatedItemType)
        : 'Money';
      const finalDonatedItemQuantity = (isCharity && fType === 'Donation')
        ? donatedItemQuantity
        : (targetAmount || '0');
      const finalDonatedItemCondition = (isCharity && fType === 'Donation')
        ? donatedItemCondition
        : 'Excellent';

      const fundraiser = await Fundraiser.create({
        fundraiser_title:        fundraiserTitle,
        fundraiser_categories:   categoriesArray,
        fundraiser_hashtags:     hashtagsArray,
        fundraiser_type:         fType,
        fundraiser_target_amount: fType === 'Fundraiser' ? parseFloat(targetAmount) : null,
        fundraiser_collected_amount: 0,
        fundraiser_status:       initialStatus,
        fundraiser_main_image:   mainImagePath,
        fundraiser_sub_image_one:   subImages[0] || null,
        fundraiser_sub_image_two:   subImages[1] || null,
        fundraiser_sub_image_three: subImages[2] || null,
        fundraiser_description:  fundraiserDescription,
        fundraiser_user_id:      userId,
        is_blocked:              blocked,
        block_reason:            blockReason,
        blocked_at:              blocked ? new Date() : null,
        // ── NEW FIELDS ──
        fundraiser_expiry_date:    fundraiserExpiryDate || null,
        fundraiser_video:          videoPath,
        donated_item_type:         finalDonatedItemTypeValue,
        donated_item_quantity:     finalDonatedItemQuantity,
        donated_item_condition:    finalDonatedItemCondition,
        fund_allocation_percentage: fundAllocationPercentage,
      });

      console.log('✅ Fundraiser created ID:', fundraiser.fundraiser_id, 'type:', fType);

      if (hashtagsArray.length > 0) {
        try {
          for (const tag of hashtagsArray) {
            await Hashtag.findOrCreate({
              where: { tag_name: tag },
              defaults: { tag_name: tag, usage_count: 1 }
            }).then(([hashtag, created]) => {
              if (!created) return hashtag.increment('usage_count');
            });
          }
        } catch (e) {
          console.error('Hashtag sync error:', e);
        }
      }

      // ── Firebase sync disabled ──────────────────────────────────────────────
      // try {
      //   const sync = new SyncFundraisers();
      //   await sync.syncToFirebase();
      // } catch (e) { console.error('⚠️ Firebase sync failed:', e); }

      if (blocked) {
        const fundraisers = await Fundraiser.findAll({ where: { fundraiser_user_id: userId, is_blocked: false }, order: [['created_at', 'DESC']] });
        return res.render('dashboard/user-panel-indigent', {
          errorMessage: 'Your fundraiser was blocked due to inappropriate content. Contact support if this is a mistake.',
          categories, fundraisers, user: buildTemplateUser(dbUser),
          userLocation: dbUser.userLocationString || 'Unknown Location',
          title: 'My Fundraisers', successMessage: null
        });
      }

      res.redirect('/userPanelIndigent?success=true');

    } catch (error) {
      console.error('💥 Error creating fundraiser:', error);
      const dbUser = await getDatabaseUserWithLocation(req);
      const userId = dbUser?.id || null;
      const categories = await Category.findAll({ attributes: ['category_id', 'category_name'], order: [['category_name', 'ASC']] });
      const fundraisers = userId ? await Fundraiser.findAll({ where: { fundraiser_user_id: userId, is_blocked: false }, order: [['created_at', 'DESC']] }) : [];

      let errorMessage = 'Error creating fundraiser: ' + error.message;
      if (error.name === 'SequelizeValidationError' &&
          error.errors.some(e => e.path === 'fundraiser_description' && e.validatorKey === 'len')) {
        errorMessage = 'Description must be between 10 and 5000 characters.';
      }

      res.render('dashboard/user-panel-indigent', {
        errorMessage, categories, fundraisers,
        user: dbUser ? buildTemplateUser(dbUser) : null,
        userLocation: dbUser?.userLocationString || 'Unknown Location',
        title: 'My Fundraisers', successMessage: null
      });
    }
  }

  // POST /delete-fundraiser/:id
  async deleteFundraiser(req, res) {
    try {
      const dbUser = await getDatabaseUserWithLocation(req);
      if (!dbUser) return res.redirect('/userPanelIndigent?error=User not authenticated');
      // Resolve public_id to fundraiser_id for internal operations
      const fundraiser = await Fundraiser.findOne({
        where: { 
          public_id: req.params.publicId,  // ← Accept public_id from URL
          fundraiser_user_id: dbUser.id 
        }
      });
      if (!fundraiser) return res.redirect('/userPanelIndigent?error=Fundraiser not found or no permission');

      await fundraiser.destroy();

      for (const imgPath of [
        fundraiser.fundraiser_main_image,
        fundraiser.fundraiser_sub_image_one,
        fundraiser.fundraiser_sub_image_two,
        fundraiser.fundraiser_sub_image_three
      ].filter(Boolean)) {
        if (imgPath.startsWith('/uploads/')) {
          const full = path.join(__dirname, '../../public', imgPath);
          if (fs.existsSync(full)) await fs.promises.unlink(full).catch(() => {});
        }
      }

      // ── Firebase delete disabled ──────────────────────────────────────────
      // const firebaseId = fundraiser.firebase_id;
      // if (firebaseId) {
      //   try {
      //     const { db } = require("../../config/firebase-admin");
      //     await db.collection('fundraisers').doc(firebaseId).delete();
      //   } catch (e) { console.error('⚠️ Firebase delete failed:', e); }
      // }

      res.redirect('/userPanelIndigent?success=Fundraiser deleted successfully');
    } catch (error) {
      console.error('💥 Delete error:', error);
      res.redirect('/userPanelIndigent?error=Error deleting fundraiser: ' + error.message);
    }
  }

  // POST /api/verification/submit
    // POST /api/verification/submit
  async submitVerification(req, res) {
    try {
      const dbUser = await getDatabaseUserWithLocation(req);
      if (!dbUser) {
        return res.status(401).json({ success: false, message: 'User not authenticated.' });
      }

      const {
        fundraiserId,
        userType,
        fullName,
        idNumber,
        currentAddress,
        charityFullName,
        licenseNumber,
        charityHeadquarters
      } = req.body;

      // ── File upload handling ──
      let needDocumentPath = null;
      let licenseCertificatePath = null;
      if (req.files?.needDocument) {
        needDocumentPath = await uploadImage(req.files.needDocument[0]);
      }
      if (req.files?.charityLicenseCertificate) {
        licenseCertificatePath = await uploadImage(req.files.charityLicenseCertificate[0]);
      }

      // Resolve public_id to internal fundraiser_id
      const fundraiser = await Fundraiser.findOne({
        where: {
          public_id: fundraiserId,  // ← fundraiserId already declared above (public_id from frontend)
          fundraiser_user_id: dbUser.id
        }
      });
      
      if (!fundraiser) {
        return res.status(404).json({
          success: false,
          message: 'Fundraiser not found or does not belong to you.'
        });
      }
      
      const internalFundraiserId = fundraiser.fundraiser_id;  // ← Use internal ID from here on

      // Check if a verification request already exists for this fundraiser
      const existingRequest = await FundraisersVerificationRequest.findOne({
        where: { fundraiser_id: internalFundraiserId }
      });

      if (existingRequest) {
        return res.status(409).json({
          success: false,
          message: 'A verification request has already been submitted for this campaign.'
        });
      }

      // Prepare data based on user type
      let requestData = {
        user_id: dbUser.id,
        user_email: dbUser.email,
        user_type: dbUser.user_type,
        fundraiser_id: internalFundraiserId,
        fundraiser_type: fundraiser.fundraiser_type,
        request_status: 'pending'
      };

      if (userType === 'Charity') {
        if (!charityFullName || !licenseNumber || !charityHeadquarters) {
          return res.status(400).json({
            success: false,
            message: 'Please fill in all charity fields: Full Name of Charity, License Number, and Charity Headquarters.'
          });
        }
        requestData.charity_full_name = charityFullName.trim();
        requestData.charity_license_number = licenseNumber.trim();
        requestData.charity_current_address = charityHeadquarters.trim();
        requestData.charity_license_certificate = licenseCertificatePath;
        // Requester fields remain null
        requestData.user_full_name = null;
        requestData.user_identity_number = null;
        requestData.user_current_address = null;
        requestData.need_document = null;
      } else {
        // Requester (Indigent) user
        if (!fullName || !idNumber || !currentAddress) {
          return res.status(400).json({
            success: false,
            message: 'Please fill in all fields: Full Name, ID Number, and Current Address.'
          });
        }
        requestData.user_full_name = fullName.trim();
        requestData.user_identity_number = idNumber.trim();
        requestData.user_current_address = currentAddress.trim();
        requestData.need_document = needDocumentPath;
        // Charity fields remain null
        requestData.charity_full_name = null;
        requestData.charity_license_number = null;
        requestData.charity_current_address = null;
        requestData.charity_license_certificate = null;
      }

      // Create the verification request record
      const verificationRequest = await FundraisersVerificationRequest.create(requestData);

      console.log(`Verification request #${verificationRequest.request_id} created for fundraiser ${fundraiserId} by ${userType} user ${dbUser.id}`);

      return res.status(200).json({
        success: true,
        message: 'Verification form submitted successfully.',
        requestId: verificationRequest.request_id
      });

    } catch (error) {
      console.error('Error submitting verification:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error. Please try again later.'
      });
    }
  }

  // GET /api/verification/status/:fundraiserId
  // GET /api/verification/status/:fundraiserId
async getVerificationStatus(req, res) {
  try {
      const dbUser = await getDatabaseUserWithLocation(req);
      if (!dbUser) return res.status(401).json({ success: false, message: 'Not authenticated.' });

      const { fundraiserId } = req.params;  // This is public_id from frontend

      // ← RESOLVE public_id to internal fundraiser_id FIRST
      const fundraiser = await Fundraiser.findOne({
          where: { public_id: fundraiserId }
      });

      if (!fundraiser) {
          return res.status(404).json({ success: false, message: 'Fundraiser not found.' });
      }

      const internalFundraiserId = fundraiser.fundraiser_id;  // ← Numeric ID

      const request = await FundraisersVerificationRequest.findOne({
          where: { 
              fundraiser_id: internalFundraiserId,  // ✅ Use numeric internal ID
              user_id: dbUser.id 
          }
      });

      if (!request) {
          return res.status(404).json({ success: false, message: 'No verification request found.' });
      }

      return res.status(200).json({
          success: true,
          status: request.request_status,
          submittedAt: request.created_at
      });
  } catch (error) {
      console.error('Error fetching verification status:', error);
      return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
  // ═════════════════════════════════════════════════════════════════════════════
// ACHIEVEMENT CREATION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/achievements/create
 * Creates a new campaign achievement (milestone or final)
 */
async createAchievement(req, res) {
  try {
    const { fundraiserId, achievementType, title, description, achievementDate } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Resolve public_id to internal fundraiser_id
    const fundraiser = await Fundraiser.findOne({
      where: { public_id: fundraiserId }
    });
    if (!fundraiser) {
      return res.status(404).json({ success: false, message: 'Fundraiser not found' });
    }
    if (fundraiser.fundraiser_user_id !== userId) {
      return res.status(403).json({ success: false, message: 'You do not own this campaign' });
    }

    const internalFundraiserId = fundraiser.fundraiser_id;  // ← Use internal ID from here on

    // Verify the corresponding transfer is completed
    const transfer = await TransferLog.findOne({
      where: {
        fundraiser_id: internalFundraiserId,  // ✅ Fixed: use internal ID
        status: 'completed',
        withdrawal_type: achievementType === 'milestone' ? 'early' : 'final'
      }
    });

    if (!transfer) {
      return res.status(400).json({
        success: false,
        message: `No completed ${achievementType === 'milestone' ? 'early' : 'final'} withdrawal found for this campaign`
      });
    }

    // Check if achievement already exists for this type
    const existingAchievement = await FundraiserAchievement.findOne({
      where: {
        fundraiser_id: internalFundraiserId,  // ✅ Fixed: use internal ID
        achievement_type: achievementType
      }
    });

    if (existingAchievement) {
      return res.status(409).json({
        success: false,
        message: `A ${achievementType} achievement already exists for this campaign`
      });
    }

    // Handle file uploads
    const files = req.files || {};
    const mainImage = files.achievementMainImage?.[0] ? await uploadImage(files.achievementMainImage[0]) : null;
    const subImage1 = files.achievementSubImage1?.[0] ? await uploadImage(files.achievementSubImage1[0]) : null;
    const subImage2 = files.achievementSubImage2?.[0] ? await uploadImage(files.achievementSubImage2[0]) : null;
    const subImage3 = files.achievementSubImage3?.[0] ? await uploadImage(files.achievementSubImage3[0]) : null;
    const video = files.achievementVideo?.[0] ? await uploadImage(files.achievementVideo[0]) : null;

    if (!mainImage) {
      return res.status(400).json({ success: false, message: 'Main image is required' });
    }

    // Create achievement
    const achievement = await FundraiserAchievement.create({
      fundraiser_id: internalFundraiserId,  // ✅ Fixed: use internal ID
      user_id: userId,
      achievement_type: achievementType,
      title: title.trim(),
      description: description.trim(),
      main_image: mainImage,
      sub_image_one: subImage1 || null,
      sub_image_two: subImage2 || null,
      sub_image_three: subImage3 || null,
      video: video || null,
      achievement_date: achievementDate || null
    });

    return res.status(201).json({
      success: true,
      message: 'Achievement created successfully',
      data: achievement
    });

  } catch (error) {
    console.error('Error creating achievement:', error);
    return res.status(500).json({ success: false, message: 'Failed to create achievement' });
  }
}
/**
 * GET /api/achievements/:fundraiserId
 * Get achievements for a fundraiser
 */
  async getAchievements(req, res) {
    try {
      const { fundraiserId } = req.params;

      // Resolve public_id to internal ID if needed
      const fundraiser = await Fundraiser.findOne({
        where: { public_id: fundraiserId }
      });
      
      const lookupId = fundraiser ? fundraiser.fundraiser_id : fundraiserId;  // Fallback to raw ID

      const achievements = await FundraiserAchievement.findAll({
        where: { fundraiser_id: lookupId },
        attributes: ['public_id', 'achievement_type', 'title', 'description', 'main_image', 'sub_image_one', 'sub_image_two', 'sub_image_three', 'video', 'achievement_date', 'created_at'],
        order: [['created_at', 'DESC']]
      });

      return res.json({ success: true, data: achievements });

      return res.json({ success: true, data: achievements });
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch achievements' });
    }
  };
}

module.exports = new UserPanelIndigentController();

