const Fundraiser = require("../../models/Fundraiser");
const User = require("../../models/User");
const Invoice = require('../../models/Invoice');
const axios = require('axios');
const { getLocationFromCoordinates } = require('../../utils/geolocation');
const { Sequelize } = require("sequelize");
// Helper function to calculate progress percentage
function calculateProgress(collected, target) {
    if (!target || target === 10) return 0;
    const progress = (collected / target) * 100;
    return Math.min(Math.round(progress), 100);
}

// Helper function to calculate progress width for CSS
function calculateProgressWidth(collected, target) {
    const progress = calculateProgress(collected, target);
    return `${progress}%`;
}


async function getFundraiserData(fundraiserId) {
    try {
        console.log('🔍 Fetching fundraiser data for ID:', fundraiserId);
        
            const fundraiser = await Fundraiser.findOne({
            where: { 
                [Sequelize.Op.or]: [
                    { public_id: fundraiserId },   // ← Try public_id first (for URLs/APIs)
                    { fundraiser_id: parseInt(fundraiserId) || 0 }  // ← Fallback to internal ID
                ]
            },
            include: [{
                model: User,
                as: 'user',
                attributes: [
                    'id', 'full_name', 'email', 'user_image', 'user_type', 
                    'phone_number','phone_international', 'location', 'gender'
                ]
            }]
        });

        if (!fundraiser) {
            console.log('❌ Fundraiser not found with ID:', fundraiserId);
            return null;
        }
        
        console.log('✅ Fundraiser found:', {
            fundraiserId: fundraiser.fundraiser_id,
            title: fundraiser.fundraiser_title,
            userId: fundraiser.fundraiser_user_id
        });

        let userLocationString = 'Unknown Location';
        if (fundraiser.user && fundraiser.user.location) {
            userLocationString = await getLocationFromCoordinates(fundraiser.user.location);
        }

        // Fetch last 3 public donations
        const recentDonations = await Invoice.findAll({
            where: { 
                fundraiser_id: fundraiser.fundraiser_id,
                status: 'paid'
            },
            include: [{
                model: require('../../models/User'),
                as: 'donor',
                attributes: ['id', 'full_name', 'user_image']
            }],
            order: [['paid_at', 'DESC']],
            limit: 3
        });

        const formattedRecentDonations = recentDonations.map(inv => ({
            donorName: inv.donor?.full_name || 'Anonymous',
            donorImage: inv.donor?.user_image || '/assets/image/Fundraiser-Page/header-sec/man-profile.png',
            amount: parseFloat(inv.gross_amount).toFixed(2),
            currency: inv.currency,
            date: inv.paid_at
        }));
        const formattedData = {
            fundraiserId: fundraiser.fundraiser_id,
            publicId: fundraiser.public_id,
            title: fundraiser.fundraiser_title,
            categories: fundraiser.fundraiser_categories || [],
            status: fundraiser.fundraiser_status,
            is_urgent: fundraiser.is_urgent,
            hashtags: fundraiser.fundraiser_hashtags || [],   // <-- ADD THIS LINE
            targetAmount: parseFloat(fundraiser.fundraiser_target_amount),
            collectedAmount: parseFloat(fundraiser.fundraiser_collected_amount),
            mainImage: fundraiser.fundraiser_main_image,
            subImages: [
                fundraiser.fundraiser_sub_image_one,
                fundraiser.fundraiser_sub_image_two,
                fundraiser.fundraiser_sub_image_three
            ].filter(img => img),
            description: fundraiser.fundraiser_description,
            createdAt: fundraiser.created_at,
            
            userId: fundraiser.user?.id,
            userName: fundraiser.user?.full_name || 'Unknown User',
            userImage: fundraiser.user?.user_image || '/assets/image/Fundraiser-Page/header-sec/man-profile.png',
            userType: fundraiser.user?.user_type,
            user: {
                user_type: fundraiser.user?.user_type,
            },
            phoneNumber: fundraiser.user?.phone_number || 'Not provided',
            phoneInternational: fundraiser.user?.phone_international || 'Not provided',
            location: userLocationString,
            recentDonations: formattedRecentDonations,
            progress: calculateProgress(fundraiser.fundraiser_collected_amount, fundraiser.fundraiser_target_amount),
            progressWidth: calculateProgressWidth(fundraiser.fundraiser_collected_amount, fundraiser.fundraiser_target_amount),
            // More campaign information fields
            fundraiser_expiry_date: fundraiser.fundraiser_expiry_date,
            fundraiser_video: fundraiser.fundraiser_video,
            donated_item_type: fundraiser.donated_item_type,
            donated_item_quantity: fundraiser.donated_item_quantity,
            donated_item_condition: fundraiser.donated_item_condition,
            fund_allocation_percentage: (() => {
                const val = fundraiser.fund_allocation_percentage;
                if (!val) return null;
                // JSONB sometimes comes back as a string depending on Sequelize config
                if (typeof val === 'string') {
                    try { return JSON.parse(val); } catch(e) { return null; }
                }
                return Array.isArray(val) ? val : null;
            })()
        };

        return formattedData;
    } catch (error) {
        console.error('💥 Error fetching fundraiser data:', error);
        return null;
    }
}

exports.getFundraiserPage = async (req, res) => {
    try {
        const fundraiserId = req.params.fundraiserId;
        console.log('👤 Loading fundraiser page for ID:', fundraiserId);
        
        if (!fundraiserId || fundraiserId.trim() === '') {
            console.log('❌ Invalid fundraiser ID provided:', fundraiserId);
            return res.status(400).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Invalid Fundraiser ID</title>
                    <link rel="stylesheet" href="/assets/css/style.css">
                </head>
                <body>
                    <div style="text-align: center; padding: 50px;">
                        <h1>Invalid Fundraiser ID</h1>
                        <p>The fundraiser ID provided is not valid.</p>
                        <a href="/all-fundraisers" style="padding: 10px 20px; background: #3498db; color: white; text-decoration: none; border-radius: 5px;">Browse Fundraisers</a>
                    </div>
                </body>
                </html>
            `);
        }

        const fundraiserData = await getFundraiserData(fundraiserId);
        
        if (!fundraiserData) {
            console.log('❌ Fundraiser not found with ID:', fundraiserId);
            return res.status(404).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Fundraiser Not Found</title>
                    <link rel="stylesheet" href="/assets/css/style.css">
                </head>
                <body>
                    <div style="text-align: center; padding: 50px;">
                        <h1>Fundraiser Not Found</h1>
                        <p>The requested fundraiser could not be found.</p>
                        <a href="/all-fundraisers" style="padding: 10px 20px; background: #3498db; color: white; text-decoration: none; border-radius: 5px;">Browse Fundraisers</a>
                    </div>
                </body>
                </html>
            `);
        }

        console.log('🎯 Rendering fundraiser page with data:', {
            fundraiserId: fundraiserData.fundraiserId,
            title: fundraiserData.title,
            progress: fundraiserData.progress
        });

        res.render('site/fundraiser', {
            title: `${fundraiserData.title} - Fundraiser`,
            fundraiserData: fundraiserData,
            currentPage: 'fundraiser',
            currentUser: req.user || null
        });
        
    } catch (error) {
        console.error('💥 Error loading fundraiser page:', error);
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
                    <p>An error occurred while loading the fundraiser page.</p>
                    <a href="/all-fundraisers" style="padding: 10px 20px; margin-top: 10px; background: #3498db; color: white; text-decoration: none; border-radius: 5px;">Browse Fundraisers</a>
                </div>
            </body>
            </html>
        `);
    }
};

exports.getFundraiserDataAPI = async (req, res) => {
    try {
        const fundraiserId = req.params.fundraiserId;
        console.log('📡 API: Fetching fundraiser data for ID:', fundraiserId);
        
        if (!fundraiserId || fundraiserId.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Invalid fundraiser ID provided'
            });
        }

        const fundraiserData = await getFundraiserData(fundraiserId);
        
        if (!fundraiserData) {
            return res.status(404).json({
                success: false,
                message: 'Fundraiser not found'
            });
        }

        res.json({
            success: true,
            data: fundraiserData
        });
        
    } catch (error) {
        console.error('💥 API Error fetching fundraiser data:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred'
        });
    }
};
