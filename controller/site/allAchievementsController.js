const { FundraiserAchievement, User, Fundraiser } = require('../../models/associations');
const AchievementLike = require('../../models/AchievementLike');
const DEFAULT_ACHIEVEMENT_IMAGE = '/assets/image/Home-Page/most-fundraisers/main-fundraiser-img.jpg';
const { Op, Sequelize } = require('sequelize');
// ============================================================
// HELPER: Build achievement data with like/comment counts
// ============================================================
async function buildAchievementData(achievementRows) {
  if (!achievementRows || achievementRows.length === 0) return [];

  // Get like counts in bulk (you'll need raw query or a Like model)
  // For now, return without like/comment counts or add them via separate queries
  return achievementRows.map(a => ({
    achievement_id: a.public_id || a.id || a.achievement_id,  // ← public ID
    internal_achievement_id: a.id || a.achievement_id,           // ← internal ID
    fundraiser_id: a.fundraiser_id,
    public_id: a.public_id,
    user_id: a.user_id,
    user_name: a.user?.full_name || 'Unknown',
    user_image: a.user?.user_image || '/assets/image/Fundraiser-Page/header-sec/man-profile.png',
    user_location: a.user?.location || '',
    user_type: a.user?.user_type || '',
    fundraiser_status: a.fundraiser?.fundraiser_status || 'incompleted',
    achievement_title: a.title,
    achievement_description: a.description || '',
    achievement_type: a.achievement_type,
    main_image: a.main_image || DEFAULT_ACHIEVEMENT_IMAGE,
    sub_images: [
      a.sub_image_one,
      a.sub_image_two,
      a.sub_image_three
    ].filter(img => img),
    achievement_video: a.video || null,
    created_at: a.created_at,
    like_count: 0,  // TODO: implement with Like model
    comment_count: 0, // TODO: implement with Comment model
    fundraiser_title: a.fundraiser?.fundraiser_title || '',
    fundraiser_categories: a.fundraiser?.fundraiser_categories || [],
  }));
}

// ============================================================
// GET /all-achievements
// ============================================================
async function getAllAchievements(req, res) {
  try {
    const searchQuery = req.query.search ? req.query.search.trim() : '';
    const currentUser = req.session?.user || req.user || null;

    let whereConditions = {};

    if (searchQuery) {
      whereConditions = {
        [Op.or]: [
          { title: { [Op.iLike]: `%${searchQuery}%` } },
          { description: { [Op.iLike]: `%${searchQuery}%` } },
          { '$fundraiser.fundraiser_title$': { [Op.iLike]: `%${searchQuery}%` } },
          Sequelize.where(
            Sequelize.fn('array_to_string', Sequelize.col('fundraiser.fundraiser_categories'), ','),
            { [Op.iLike]: `%${searchQuery}%` }
          ),
          { '$user.full_name$': { [Op.iLike]: `%${searchQuery}%` } }
        ]
      };
    }

    const allResult = await FundraiserAchievement.findAll({
      where: whereConditions,
      include: [
        { model: User, as: 'user', attributes: ['id', 'full_name', 'user_image', 'location', 'user_type'] },
        { model: Fundraiser, as: 'fundraiser', attributes: ['fundraiser_id', 'fundraiser_status', 'fundraiser_title', 'fundraiser_categories'], required: false }
      ],
      order: [['created_at', 'DESC']]
    });

    const allAchievements = await buildAchievementData(allResult);

    let latestAchievements = [];
    let milestoneAchievements = [];
    let finalAchievements = [];

    if (searchQuery) {
      latestAchievements = allAchievements;
    } else {
      latestAchievements = allAchievements;
      milestoneAchievements = allAchievements.filter(a => a.achievement_type === 'milestone');
      finalAchievements = allAchievements.filter(a => a.achievement_type === 'final');
    }

    res.render('site/all-achievements', {
      latestAchievements,
      milestoneAchievements,
      finalAchievements,
      allAchievements,
      searchQuery,
      isSearching: !!searchQuery,
      user: currentUser,
      currentUser
    });

  } catch (err) {
    console.error('[getAllAchievements] Error:', err);
    res.status(500).send('Failed to load achievements.');
  }
}

// ============================================================
// POST /api/achievement/:achievementId/like
// ============================================================
// ============================================================
// POST /api/achievement/:achievementId/like
// ============================================================
async function toggleLike(req, res) {
  try {
    const achievementId = parseInt(req.params.achievementId);
    const userId = req.user?.id || req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Please log in to like' });
    }

    // Check if like already exists
    const existingLike = await AchievementLike.findOne({
      where: { achievement_id: achievementId, user_id: userId }
    });

    let liked = false;
    let likeCount = 0;

    if (existingLike) {
      // Unlike: remove the like
      await existingLike.destroy();
      liked = false;
    } else {
      // Like: create new like
      await AchievementLike.create({
        achievement_id: achievementId,
        user_id: userId
      });
      liked = true;
    }

    // Get updated count
    likeCount = await AchievementLike.count({
      where: { achievement_id: achievementId }
    });

    res.json({ success: true, liked, likeCount });

  } catch (err) {
    console.error('[toggleLike] Error:', err);
    res.status(500).json({ success: false, message: 'Failed to update like' });
  }
}

// ============================================================
// GET /api/achievement/:achievementId/like-status
// ============================================================
// ============================================================
// GET /api/achievement/:achievementId/like-status
// ============================================================
async function getLikeStatus(req, res) {
  try {
    const achievementId = parseInt(req.params.achievementId);
    const userId = req.user?.id || req.session?.user?.id;

    let liked = false;
    if (userId) {
      const existingLike = await AchievementLike.findOne({
        where: { achievement_id: achievementId, user_id: userId }
      });
      liked = !!existingLike;
    }

    const likeCount = await AchievementLike.count({
      where: { achievement_id: achievementId }
    });

    res.json({ liked, likeCount });

  } catch (err) {
    console.error('[getLikeStatus] Error:', err);
    res.json({ liked: false, likeCount: 0 });
  }
}

module.exports = {
  getAllAchievements,
  toggleLike,
  getLikeStatus
};