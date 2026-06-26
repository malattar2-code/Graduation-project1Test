const { Op } = require('sequelize');
const User = require('../../models/User');
const Fundraiser = require('../../models/Fundraiser');
const FundraiserForm = require('../../models/FundraiserForm');
const FundraiserRequest = require('../../models/FundraiserRequest');
const { getLocationFromCoordinates } = require('../../utils/geolocation');

// GET individual user account page
async function getIndigentAccount(req, res) {
    try {
        const userId = req.params.userId;
        console.log('👤 Loading indigent account page for user ID:', userId);

        // Get user information
        const user = await User.findOne({
            where: { id: userId },
            attributes: ['id', 'full_name', 'user_image', 'gender', 'phone_number','phone_international', 'birth_date', 'location', 'user_type', 'email']
        });

        if (!user) {
            return res.status(404).render('site/indigent-account', {
                title: 'User Not Found',
                errorMessage: 'User not found',
                user: null,
                fundraisers: []
            });
        }

        // Get user's fundraisers — both standard & charity campaigns
        const fundraisers = await Fundraiser.findAll({
            where: {
                fundraiser_user_id: userId,
                fundraiser_status: {
                    [Op.in]: ['incompleted', 'Waiting_requesters']
                }
            },
            include: [
                {
                    model: FundraiserForm,
                    as: 'form',
                    required: false
                }
            ],
            order: [['created_at', 'DESC']]
        });

        // Calculate progress + attach charity-specific fields
        const fundraisersWithProgress = await Promise.all(fundraisers.map(async (fundraiser) => {
            const collected = parseFloat(fundraiser.fundraiser_collected_amount) || 0;
            const target = parseFloat(fundraiser.fundraiser_target_amount) || 1;
            const progress = Math.min((collected / target) * 100, 100);

            const formatted = {
                ...fundraiser.toJSON(),
                progress: Math.round(progress),
                progressWidth: `${progress}%`,
                formattedCollected: collected.toLocaleString(),
                formattedTarget: target.toLocaleString()
            };

            // Charity campaign: attach form stats & logged-in user's submission status
            if (fundraiser.fundraiser_status === 'Waiting_requesters' && fundraiser.form) {
                formatted.form_current = fundraiser.form.current_requesters_number;
                formatted.form_target  = fundraiser.form.target_requesters_number;
                formatted.form_id      = fundraiser.form.id;

                if (req.user) {
                    const existingRequest = await FundraiserRequest.findOne({
                        where: {
                            form_id: fundraiser.form.id,
                            user_id: req.user.id
                        }
                    });
                    formatted.user_has_submitted = !!existingRequest;
                } else {
                    formatted.user_has_submitted = false;
                }
            }

            return formatted;
        }));

        // Get location string from coordinates
        let userLocationString = 'Unknown Location';
        if (user.location) {
            userLocationString = await getLocationFromCoordinates(user.location);
        }

        // Format user data for display
        const formattedUser = {
            id: user.id,
            full_name: user.full_name,
            user_image: user.user_image || '/images/default-profile.png',
            gender: user.gender || 'Not specified',
            phone_number: user.phone_number || 'Not provided',
            phone_international: user.phone_international || 'Not provided',
            birth_date: user.birth_date ? new Date(user.birth_date).toLocaleDateString() : 'Not provided',
            user_type: user.user_type,
            email: user.email,
            location: userLocationString
        };

        console.log('✅ Loaded user data:', formattedUser.full_name);
        console.log('✅ Number of fundraisers:', fundraisers.length);

        res.render('site/indigent-account', {
            title: `${formattedUser.full_name}'s Account`,
            user: formattedUser,
            authUser: req.user || null,
            fundraisers: fundraisersWithProgress,
            errorMessage: null
        });

    } catch (error) {
        console.error('💥 Error loading indigent account:', error);
        res.status(500).render('site/indigent-account', {
            title: 'Error',
            user: null,
            fundraisers: [],
            errorMessage: 'Error loading user account: ' + error.message
        });
    }
}

module.exports = {
    getIndigentAccount
};