const SavedFundraiser = require('../../models/SavedFundraiser');
const Fundraiser = require('../../models/Fundraiser');
const User = require('../../models/User');
const { Sequelize } = require('sequelize');
const { getLocationFromCoordinates } = require('../../utils/geolocation');

// Helper function to format fundraiser data
async function formatFundraiserData(fundraiser) {
    const collected = parseFloat(fundraiser.fundraiser_collected_amount) || 0;
    const target = parseFloat(fundraiser.fundraiser_target_amount) || 1;
    const progress = Math.min((collected / target) * 100, 100);

    // Get location for display
    const userLocation = fundraiser.user ? 
        await getLocationFromCoordinates(fundraiser.user.location) : 
        'Unknown Location';

    return {
        fundraiser_id: fundraiser.fundraiser_id,
        fundraiser_title: fundraiser.fundraiser_title,
        fundraiser_description: fundraiser.fundraiser_description,
        fundraiser_main_image: fundraiser.fundraiser_main_image,
        fundraiser_collected_amount: collected.toLocaleString(),
        fundraiser_target_amount: target.toLocaleString(),
        fundraiser_categories: fundraiser.fundraiser_categories || [],
        fundraiser_user_id: fundraiser.fundraiser_user_id,
        progress: Math.round(progress),
        progressWidth: `${progress}%`,
        user_name: fundraiser.user ? fundraiser.user.full_name : 'Unknown User',
        user_image: fundraiser.user ? fundraiser.user.user_image : '/images/default-profile.png',
        user_location: userLocation,
        created_at: fundraiser.created_at
    };
}

// Save a fundraiser
async function saveFundraiser(req, res) {
  try {
    const { fundraiserId } = req.params;
    const currentUser = await User.findOne({
      where: { id: req.user.id }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if fundraiser exists
    const fundraiser = await Fundraiser.findOne({
      where: {
        [Sequelize.Op.or]: [
          { public_id: fundraiserId },
          { fundraiser_id: parseInt(fundraiserId) || 0 }
        ]
      }
    });
    if (!fundraiser) {
      return res.status(404).json({ error: 'Fundraiser not found' });
    }

    const resolvedFundraiserId = fundraiser.fundraiser_id;

    // Check if already saved
    const existingSave = await SavedFundraiser.findOne({
      where: {
        user_id: currentUser.id,
        fundraiser_id: resolvedFundraiserId
      }
    });

    if (existingSave) {
      return res.status(400).json({ error: 'Fundraiser already saved' });
    }

    // Save the fundraiser
    const savedFundraiser = await SavedFundraiser.create({
      user_id: currentUser.id,
      fundraiser_id: resolvedFundraiserId
    });

    res.json({ 
      success: true, 
      message: 'Fundraiser saved successfully',
      saved_id: savedFundraiser.saved_id
    });

  } catch (error) {
    console.error('Error saving fundraiser:', error);
    res.status(500).json({ error: 'Failed to save fundraiser' });
  }
}

// Unsave a fundraiser
async function unsaveFundraiser(req, res) {
  try {
    const { fundraiserId } = req.params;
    const currentUser = await User.findOne({
      where: { id: req.user.id }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const fundraiser = await Fundraiser.findOne({
      where: {
        [Sequelize.Op.or]: [
          { public_id: fundraiserId },
          { fundraiser_id: parseInt(fundraiserId) || 0 }
        ]
      }
    });

    if (!fundraiser) {
      return res.status(404).json({ error: 'Fundraiser not found' });
    }

    const resolvedFundraiserId = fundraiser.fundraiser_id;

    const result = await SavedFundraiser.destroy({
      where: {
        user_id: currentUser.id,
        fundraiser_id: resolvedFundraiserId
      }
    });

    if (result === 0) {
      return res.status(404).json({ error: 'Saved fundraiser not found' });
    }

    res.json({ 
      success: true, 
      message: 'Fundraiser removed from saved items'
    });

  } catch (error) {
    console.error('Error unsaving fundraiser:', error);
    res.status(500).json({ error: 'Failed to remove saved fundraiser' });
  }
}

// Check if fundraiser is saved by current user
async function checkSavedStatus(req, res) {
  try {
    const { fundraiserId } = req.params;
    const currentUser = await User.findOne({
      where: { id: req.user.id }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

        const fundraiser = await Fundraiser.findOne({
      where: {
        [Sequelize.Op.or]: [
          { public_id: fundraiserId },
          { fundraiser_id: parseInt(fundraiserId) || 0 }
        ]
      }
    });

    if (!fundraiser) {
      return res.json({ isSaved: false });
    }

    const resolvedFundraiserId = fundraiser.fundraiser_id;

    const saved = await SavedFundraiser.findOne({
      where: {
        user_id: currentUser.id,
        fundraiser_id: resolvedFundraiserId
      }
    });

    res.json({ isSaved: !!saved });

  } catch (error) {
    console.error('Error checking saved status:', error);
    res.status(500).json({ error: 'Failed to check saved status' });
  }
}

// Get saved fundraisers for current user
async function getMySavedFundraisers(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const offset = (page - 1) * limit;

    const currentUser = await User.findOne({
      where: { id: req.user.id }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { count, rows: savedFundraisers } = await SavedFundraiser.findAndCountAll({
      where: { user_id: currentUser.id },
      include: [{
        model: Fundraiser,
        as: 'fundraiser',
        include: [{
          model: User,
          as: 'user',
          attributes: ['full_name', 'location', 'user_image']
        }]
      }],
      order: [['saved_at', 'DESC']],
      limit: limit,
      offset: offset
    });

    // Extract and format fundraiser data
    const formattedFundraisers = await Promise.all(
      savedFundraisers
        .filter(item => item.fundraiser)
        .map(item => formatFundraiserData(item.fundraiser))
    );

    const totalPages = Math.ceil(count / limit);
    const hasMore = page < totalPages;

    res.json({
      fundraisers: formattedFundraisers,
      currentPage: page,
      totalPages: totalPages,
      hasMore: hasMore,
      totalCount: count
    });

  } catch (error) {
    console.error('Error fetching saved fundraisers:', error);
    res.status(500).json({ error: 'Failed to fetch saved fundraisers' });
  }
}

module.exports = {
  saveFundraiser,
  unsaveFundraiser,
  checkSavedStatus,
  getMySavedFundraisers
};