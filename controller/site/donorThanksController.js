const { Sequelize, Op } = require('sequelize');
const Invoice = require('../../models/Invoice');
const User = require('../../models/User');
const Fundraiser = require('../../models/Fundraiser');
const DonorsThanks = require('../../models/DonorsThanks');
const UserRankPoint = require('../../models/UserRankPoint');

// GET /api/donors/my-donors
async function getMyDonors(req, res) {
  try {
    // Use PostgreSQL ID from Passport session
    const userId = req.user.id;
    console.log('🎯 Getting donors for PostgreSQL user ID:', userId);

    // Step 1: Current user is already available via req.user
    const currentUser = {
      id: req.user.id,
      full_name: req.user.full_name,
      user_image: req.user.user_image
    };

    // Step 2: Get all fundraisers owned by current user
    const userFundraisers = await Fundraiser.findAll({
      where: { fundraiser_user_id: currentUser.id },
      attributes: ['fundraiser_id'],
      raw: true
    });

    if (userFundraisers.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const fundraiserIds = userFundraisers.map(f => f.fundraiser_id);

    // Step 3: Get unique donors who paid to these fundraisers (limit 15)
    const donors = await Invoice.findAll({
      attributes: [
        'donor_id',
        // REMOVED: [Sequelize.fn('MAX', Sequelize.col('donor_name')), 'donor_name'],
        [Sequelize.fn('MAX', Sequelize.col('paid_at')), 'last_donation_date']
      ],
      where: {
        fundraiser_id: fundraiserIds,
        status: 'paid',
        donor_id: { [Op.ne]: String(currentUser.id) }
      },
      group: ['donor_id'],
      order: [[Sequelize.fn('MAX', Sequelize.col('paid_at')), 'DESC']],
      limit: 15,
      raw: true
    });

    console.log(`📊 Found ${donors.length} unique donors (limited to 15)`);

    // Step 4: Fetch user details for each donor (now using donor's PostgreSQL ID)
    const donorsWithDetails = await Promise.all(
      donors.map(async (donor) => {
        const donorUser = await User.findByPk(donor.donor_id, {
          attributes: ['id', 'full_name', 'user_image'],
          raw: true
        });

        const alreadyThanked = donorUser
          ? !!(await DonorsThanks.findOne({
              where: {
                user_thanked_id: donorUser.id,
                user_grateful_id: currentUser.id
              },
              raw: true
            }))
          : false;

        return {
          donor_postgres_id: donorUser ? donorUser.id : null,
          full_name: donorUser ? donorUser.full_name : 'Anonymous Donor', // CHANGED: was donor.donor_name
          user_image: donorUser ? donorUser.user_image : null,
          last_donation_date: donor.last_donation_date,
          already_thanked: alreadyThanked
        };
      })
    );

    // Filter out any donors we couldn't link to a user
    const validDonors = donorsWithDetails.filter(d => d.donor_postgres_id);

    res.json({
      success: true,
      data: validDonors,
      count: validDonors.length,
      limit: 15
    });
  } catch (error) {
    console.error('💥 Error getting donors:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch donors: ' + error.message });
  }
}

// POST /api/donors/thank-donor
async function thankDonor(req, res) {
  try {
    const { donor_postgres_id } = req.body;
    // Use PostgreSQL ID
    const currentUserId = req.user.id;

    if (!donor_postgres_id) {
      return res.status(400).json({ success: false, error: 'Donor ID is required' });
    }

    console.log('🙏 Thanking donor:', { donor_postgres_id, currentUserId });

    // Step 1: Current user details
    const currentUser = {
      id: currentUserId,
      full_name: req.user.full_name,
      user_image: req.user.user_image
    };

    // Step 2: Donor user
    const donorUser = await User.findByPk(donor_postgres_id, {
      attributes: ['id', 'full_name', 'user_image', 'email']
    });
    if (!donorUser) {
      return res.status(404).json({ success: false, error: 'Donor user not found' });
    }

    // Step 3: Check if already thanked
    const existingThanks = await DonorsThanks.findOne({
      where: {
        user_thanked_id: donor_postgres_id,
        user_grateful_id: currentUserId
      }
    });
    if (existingThanks) {
      return res.status(400).json({ success: false, error: 'You have already thanked this donor' });
    }

    // Step 4: Create thank record
    const thankRecord = await DonorsThanks.create({
      user_thanked_id: donor_postgres_id,
      user_grateful_id: currentUserId,
      user_grateful_full_name: currentUser.full_name,
      user_grateful_image: currentUser.user_image
    });
    console.log('✅ Thank record created:', thankRecord.id);

    // Step 5: Add 5 points to donor's rank
    let donorRankPoints = await UserRankPoint.findOne({
      where: { userId: donor_postgres_id }
    });

    if (!donorRankPoints) {
      donorRankPoints = await UserRankPoint.create({
        userId: donor_postgres_id,
        userEmail: donorUser.email || '',
        fullName: donorUser.full_name,
        userImage: donorUser.user_image,
        userPoints: 5,
        currentRankId: 1 // adjust as needed
      });
    } else {
      await donorRankPoints.update({
        userPoints: donorRankPoints.userPoints + 5
      });
    }
    console.log(`✅ Added 5 points to donor ${donorUser.full_name}. Total: ${donorRankPoints.userPoints}`);

    res.json({
      success: true,
      message: 'Thank you sent successfully! Donor received 5 points.',
      data: {
        thank_id: thankRecord.id,
        donor_points: donorRankPoints.userPoints
      }
    });
  } catch (error) {
    console.error('💥 Error thanking donor:', error);
    res.status(500).json({ success: false, error: 'Failed to thank donor: ' + error.message });
  }
}

// GET /api/donors/my-thankers
async function getMyThankers(req, res) {
  try {
    // Use PostgreSQL ID
    const currentUserId = req.user.id;
    console.log('🙏 Getting users who thanked user ID:', currentUserId);

    const gratefulUsers = await DonorsThanks.findAll({
      where: { user_thanked_id: currentUserId },
      include: [{
        model: User,
        as: 'gratefulUser',
        attributes: ['id', 'full_name', 'user_image']
      }],
      order: [['created_at', 'DESC']],
      limit: 5,
      raw: true,
      nest: true
    });

    const formattedThankers = gratefulUsers.map(t => ({
      id: t.id,
      user_grateful_id: t.user_grateful_id,
      full_name: t.user_grateful_full_name,
      user_image: t.user_grateful_image,
      created_at: t.created_at,
      points: '+5 points'
    }));

    res.json({
      success: true,
      data: formattedThankers,
      count: formattedThankers.length,
      limit: 5
    });
  } catch (error) {
    console.error('💥 Error getting grateful users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch grateful users: ' + error.message });
  }
}

module.exports = {
  getMyDonors,
  thankDonor,
  getMyThankers
};