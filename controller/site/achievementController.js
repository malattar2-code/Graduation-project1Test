const { FundraiserAchievement, User, Fundraiser } = require('../../models/associations');
const AchievementLike = require('../../models/AchievementLike');
const AchievementComment = require('../../models/AchievementComment');
const { Op } = require('sequelize');

const DEFAULT_ACHIEVEMENT_IMAGE = '/assets/image/Home-Page/most-fundraisers/main-fundraiser-img.jpg';

// ============================================================
// GET /achievement/:achievementId
// ============================================================
async function getAchievementPage(req, res) {
  try {
    const achievementId = parseInt(req.params.achievementId);
    const currentUser = req.session?.user || req.user || null;

    const achievement = await FundraiserAchievement.findOne({
      where: { id: achievementId },
      include: [
        { model: User, as: 'user' },
        { model: Fundraiser, as: 'fundraiser' }
      ]
    });

    if (!achievement) {
      return res.status(404).render('site/error', {
        message: 'Achievement not found.'
      });
    }

    const likeCount = await AchievementLike.count({
      where: { achievement_id: achievementId }
    });

    const commentCount = await AchievementComment.count({
      where: { achievement_id: achievementId, is_blocked: false }
    });

    let subImages = [];
    try {
      subImages = achievement.sub_images ? JSON.parse(achievement.sub_images) : [];
    } catch (e) {
      subImages = [];
    }

    const achievementData = {
      achievementId: achievement.public_id,           // ← public ID for display
      internalAchievementId: achievement.id,          // ← internal use only
      fundraiserId: achievement.fundraiser_id,
      publicId: achievement.fundraiser?.public_id || null,
      userId: achievement.user_id,
      userName: achievement.user?.full_name || 'Unknown',
      userImage: achievement.user?.user_image || '/assets/image/Fundraiser-Page/header-sec/man-profile.png',
      userLocation: achievement.user?.location || '',
      userType: achievement.user?.user_type || '',
      fundraiserStatus: achievement.fundraiser?.fundraiser_status || 'incompleted',
      achievementTitle: achievement.title,
      achievementDescription: achievement.description || '',
      achievementType: achievement.achievement_type,
      mainImage: achievement.main_image || DEFAULT_ACHIEVEMENT_IMAGE,
      subImages: subImages,
      achievementVideo: achievement.video || null,
      createdAt: achievement.created_at,
      likeCount,
      commentCount,
      fundraiserTitle: achievement.fundraiser?.fundraiser_title || '',
      fundraiserMainImage: achievement.fundraiser?.fundraiser_main_image || DEFAULT_ACHIEVEMENT_IMAGE,
      fundraiserSubImages: [
        achievement.fundraiser?.fundraiser_sub_image_one,
        achievement.fundraiser?.fundraiser_sub_image_two,
        achievement.fundraiser?.fundraiser_sub_image_three
      ].filter(img => img),
      fundraiserDescription: achievement.fundraiser?.fundraiser_description || '',
      fundraiserTargetAmount: achievement.fundraiser?.fundraiser_target_amount || 0,
            fundraiserCategories: achievement.fundraiser?.fundraiser_categories || [],
      fundraiserCollectedAmount: achievement.fundraiser?.fundraiser_collected_amount || 0
    };

    const otherAchievements = await FundraiserAchievement.findAll({
      where: {
        fundraiser_id: achievement.fundraiser_id,
        id: { [Op.ne]: achievementId }
      },
      attributes: ['id', 'public_id', 'title', 'achievement_type', 'main_image', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    const formattedOther = otherAchievements.map(a => ({
      achievement_id: a.public_id,  // ← public ID for links
      internal_achievement_id: a.id, // ← internal use only
      achievement_title: a.title,
      achievement_type: a.achievement_type,
      main_image: a.main_image || DEFAULT_ACHIEVEMENT_IMAGE,
      created_at: a.created_at
    }));

    res.render('site/achievement', {
      achievementData,
      otherAchievements: formattedOther,
      currentUser
    });

  } catch (err) {
    console.error('[getAchievementPage] Error:', err);
    res.status(500).render('site/error', {
      message: 'Failed to load achievement.',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
}

// ============================================================
// GET /api/achievement-data/:achievementId
// ============================================================
async function getAchievementDataAPI(req, res) {
  try {
    const achievementId = parseInt(req.params.achievementId);

    const likeCount = await AchievementLike.count({
      where: { achievement_id: achievementId }
    });

    const commentCount = await AchievementComment.count({
      where: { achievement_id: achievementId, is_blocked: false }
    });

    res.json({
      success: true,
      likeCount,
      commentCount
    });

  } catch (err) {
    console.error('[getAchievementDataAPI] Error:', err);
    res.status(500).json({ success: false, message: 'Failed to load achievement data' });
  }
}

module.exports = {
  getAchievementPage,
  getAchievementDataAPI
};