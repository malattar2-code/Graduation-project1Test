const { Op } = require('sequelize');
const UserRankPoint = require('../../models/UserRankPoint');
const User = require('../../models/User');
const Rank = require('../../models/Rank');
const { getLocationFromCoordinates } = require('../../utils/geolocation');

// Helper function to get user and rank data by user ID
async function getUserAndRankData(userId) {
    try {
        console.log('🔍 Fetching user and rank data for user ID:', userId);

        // First, check if user exists in users table
        const user = await User.findByPk(parseInt(userId));

        if (!user) {
            console.log('❌ User not found in users table with ID:', userId);
            return null;
        }

        console.log('✅ User found:', {
            userId: user.id,
            fullName: user.full_name,
            userType: user.user_type
        });

        // Check if user has rank points record
        let userRankData = await UserRankPoint.findOne({
            where: { userId: parseInt(userId) },
            include: [
                {
                    model: User,
                    as: 'User',
                    attributes: [
                        'id', 'full_name', 'email', 'user_image', 'user_type', 
                        'phone_number','phone_international','location', 'gender', 'birth_date'
                    ]
                },
                {
                    model: Rank,
                    as: 'Rank',
                    attributes: ['rewardName', 'rewardImage', 'rankName', 'rankDescription']
                }
            ]
        });

        // If no rank points record exists, create a default one
        if (!userRankData) {
            console.log('📝 No rank points record found, creating default record for user:', userId);

            // Find appropriate rank based on 0 points
            const defaultRank = await Rank.findOne({
                where: {
                    minimumPoints: 0,
                    maximumPoints: { [Op.gte]: 0 }
                }
            });
            // Create default rank points record
            userRankData = await UserRankPoint.create({
                userId: user.id,
                userEmail: user.email || '',
                fullName: user.full_name || 'Unknown User',
                userImage: user.user_image || '/assets/image/Fundraiser-Page/header-sec/man-profile.png',
                userPoints: 0,
                currentRankId: defaultRank ? defaultRank.rankId : null,
                rankName: defaultRank ? defaultRank.rankName : 'No Rank',
                rankImage: defaultRank ? defaultRank.rankImage : '/assets/image/Account-Page/rank.png',
                rewardName: defaultRank ? defaultRank.rewardName : null,
                rewardImage: defaultRank ? defaultRank.rewardImage : null,
                rankColor: defaultRank ? defaultRank.rankColor : '#000',
            });

            console.log('✅ Created default rank points record for user:', userId);
        }

        console.log('✅ User rank data found/created:', {
            userId: userRankData.userId,
            fullName: userRankData.fullName,
            userPoints: userRankData.userPoints,
            rankName: userRankData.rankName,
            rewardName: userRankData.rewardName
        });

        // Get location string from coordinates
        let userLocationString = 'Unknown Location';
        if (user.location) {
            userLocationString = await getLocationFromCoordinates(user.location);
        }

        // Get reward data - prioritize UserRankPoint data, fall back to Rank data
        const rewardName = userRankData.rewardName || (userRankData.Rank ? userRankData.Rank.rewardName : null);
        const rewardImage = userRankData.rewardImage || (userRankData.Rank ? userRankData.Rank.rewardImage : null);

        // Format the data
        const formattedData = {
            // User rank points data
            userId: userRankData.userId,
            userEmail: userRankData.userEmail,
            fullName: userRankData.fullName || user.full_name || 'Unknown User',
            userImage: userRankData.userImage || user.user_image || '/assets/image/Fundraiser-Page/header-sec/man-profile.png',
            userPoints: userRankData.userPoints || 0,
            rankName: userRankData.rankName || 'No Rank',
            rankImage: userRankData.rankImage || '/assets/image/Account-Page/rank.png',
            rankColor: userRankData.rankColor || '#000',
            currentRankId: userRankData.currentRankId,

            // Reward data
            rewardName: rewardName,
            rewardImage: rewardImage,

            // User table data
            userType: user.user_type || 'donor',
            phoneNumber: user.phone_number || 'Not provided',
            phoneInternational: user.phone_international || 'Not provided',
            email: user.email || userRankData.userEmail,
            gender: user.gender || 'Not provided',
            birthDate: user.birth_date || 'Not provided',
            location: userLocationString
        };

        return formattedData;
    } catch (error) {
        console.error('💥 Error fetching user and rank data:', error);
        return null;
    }
}

// GET donor account page
async function getDonorAccount(req, res) {
    try {
        const userId = req.params.userId;
        console.log('👤 Loading donor account page for user ID:', userId);

        // Validate user ID
        if (!userId || isNaN(parseInt(userId))) {
            console.log('❌ Invalid user ID provided:', userId);
            return res.status(400).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Invalid User ID</title>
                    <link rel="stylesheet" href="/assets/css/style.css">
                </head>
                <body>
                    <div style="text-align: center; padding: 50px;">
                        <h1>Invalid User ID</h1>
                        <p>The user ID provided is not valid.</p>
                        <a href="/" style="padding: 10px 20px; background: #3498db; color: white; text-decoration: none; border-radius: 5px;">Return to Home</a>
                    </div>
                </body>
                </html>
            `);
        }

        // Get user and rank data
        const userData = await getUserAndRankData(userId);

        if (!userData) {
            console.log('❌ User not found with ID:', userId);
            return res.status(404).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>User Not Found</title>
                    <link rel="stylesheet" href="/assets/css/style.css">
                </head>
                <body>
                    <div style="text-align: center; padding: 50px;">
                        <h1>User Not Found</h1>
                        <p>The requested user could not be found in the system.</p>
                        <a href="/" style="padding: 10px 20px; background: #3498db; color: white; text-decoration: none; border-radius: 5px;">Return to Home</a>
                    </div>
                </body>
                </html>
            `);
        }

        console.log('🎯 Rendering donor account page with data:', {
            userId: userData.userId,
            fullName: userData.fullName,
            userPoints: userData.userPoints,
            rankName: userData.rankName,
            userType: userData.userType
        });

        res.render('site/donor-account', {
            title: `${userData.fullName} - Donor Account`,
            userData: userData,
            currentPage: 'donor-account'
        });

    } catch (error) {
        console.error('💥 Error loading donor account page:', error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Server Error</title>
                <link rel="stylesheet" href="/assets/css/style.css">
            </head>
            <body>
                <div style="text-align: center; padding: 50px;">
                    <h1>Server Error</h1>
                    <p>An error occurred while loading the page.</p>
                    <a href="/" style="padding: 10px 20px; margin-top: 10px; background: #3498db; color: white; text-decoration: none; border-radius: 5px;">Return to Home</a>
                </div>
            </body>
            </html>
        `);
    }
}

// API endpoint for dynamic data loading (for JavaScript)
async function getDonorDataAPI(req, res) {
    try {
        const userId = req.params.userId;
        console.log('📡 API: Fetching donor data for user ID:', userId);

        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID provided'
            });
        }

        const userData = await getUserAndRankData(userId);

        if (!userData) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: userData
        });

    } catch (error) {
        console.error('💥 API Error fetching donor data:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred'
        });
    }
}

module.exports = {
    getUserAndRankData,
    getDonorAccount,
    getDonorDataAPI
};