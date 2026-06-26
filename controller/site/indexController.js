const EmergencyReliefBanner = require('../../models/EmergencyReliefBanner');
const UserRankPoint = require('../../models/UserRankPoint');
const User = require('../../models/User');
const FAQ = require('../../models/FAQ');
const Fundraiser = require('../../models/Fundraiser');
const FundraiserForm = require('../../models/FundraiserForm');
const FundraiserRequest = require('../../models/FundraiserRequest');
const path = require('path');
const fs = require('fs');
const moment = require("moment");
const { Sequelize } = require("sequelize");
// DISABLED: Firebase Admin removed per requirements
// const { db } = require('../../config/firebase-admin');
// const fetch = require('node-fetch');
const axios = require('axios');
const { getLocationFromCoordinates } = require('../../utils/geolocation');
// DISABLED: Firestore-based pending requests removed. Using PostgreSQL-only getRecentWaitingRequesters instead.

async function getRecentWaitingRequesters(req) {
    try {
        console.log('📋 Fetching recent Waiting_requesters campaigns from PostgreSQL...');
        
        const userId = req.user ? req.user.id : null;
        
        const waitingFundraisers = await Fundraiser.findAll({
            where: {
                fundraiser_status: 'Waiting_requesters',
                fundraiser_type: { [Sequelize.Op.in]: ['Fundraiser', 'Donation'] },
                is_blocked: false
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'full_name', 'user_image', 'email', 'location','user_type']
                },
                {
                    model: FundraiserForm,
                    as: 'form',
                    required: true,
                    where: Sequelize.where(
                        Sequelize.col('form.current_requesters_number'),
                        Sequelize.Op.lt,
                        Sequelize.col('form.target_requesters_number')
                    )
                }
            ],
            order: [['created_at', 'DESC']],
            limit: 3
        });

        console.log(`✅ Found ${waitingFundraisers.length} Waiting_requesters campaigns`);

        const formattedFundraisers = [];
        
        for (const fundraiser of waitingFundraisers) {
            let locationString = 'Unknown Location';
            
            if (fundraiser.user && fundraiser.user.location) {
                locationString = await getLocationFromCoordinates(fundraiser.user.location);
            }
            
            let userHasSubmitted = false;
            if (userId && fundraiser.form) {
                const existingRequest = await FundraiserRequest.findOne({
                    where: {
                        form_id: fundraiser.form.id,
                        user_id: userId
                    }
                });
                userHasSubmitted = !!existingRequest;
            }
            
            let formattedDate = 'Date not available';
            if (fundraiser.created_at) {
                formattedDate = moment(fundraiser.created_at).format('DD-MM-YYYY HH:mm');
            }

            formattedFundraisers.push({
                id: fundraiser.fundraiser_id,
                public_id: fundraiser.public_id,
                title: fundraiser.fundraiser_title,
                description: fundraiser.fundraiser_description,
                main_image: fundraiser.fundraiser_main_image,
                created_at: fundraiser.created_at,
                formattedDate: formattedDate,
                type: fundraiser.fundraiser_categories ? fundraiser.fundraiser_categories[0] : 'Uncategorized',
                categories: fundraiser.fundraiser_categories || [],
                location: locationString,
                is_urgent: fundraiser.is_urgent,
                user: {
                    id: fundraiser.user?.id,
                    full_name: fundraiser.user?.full_name || 'Unknown User',
                    user_image: fundraiser.user?.user_image || '/assets/image/Fundraiser-Page/header-sec/man-profile.png',
                    user_type: fundraiser.user?.user_type,
                },
                user_has_submitted: userHasSubmitted,
                form_current: fundraiser.form ? fundraiser.form.current_requesters_number : 0,
                form_target: fundraiser.form ? fundraiser.form.target_requesters_number : 0,
                form_id: fundraiser.form ? fundraiser.form.id : null
            });
        }

        return formattedFundraisers;
        
    } catch (error) {
        console.error('💥 Error fetching Waiting_requesters campaigns:', error);
        return [];
    }
}

async function getTopTrendingFundraisers() {
    try {
        console.log('📊 Fetching top 5 trending fundraisers...');
        
        const topFundraisers = await Fundraiser.findAll({
            where: {
                [Sequelize.Op.and]: [
                    {
                        fundraiser_categories: {
                            [Sequelize.Op.contains]: ['trend']
                        }
                    },
                    {
                        fundraiser_status: 'incompleted'
                    }
                ]
            },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'full_name', 'user_image', 'email', 'location','user_type']
            }],
            order: [['fundraiser_target_amount', 'DESC']],
            limit: 5
        });

        console.log(`✅ Found ${topFundraisers.length} trending fundraisers`);
        
        const formattedFundraisers = [];
        
        for (const fundraiser of topFundraisers) {
            let locationString = 'Unknown Location';
            
            if (fundraiser.user && fundraiser.user.location) {
                locationString = await getLocationFromCoordinates(fundraiser.user.location);
            }
            
            const formattedFundraiser = {
                id: fundraiser.fundraiser_id,
                public_id: fundraiser.public_id,
                title: fundraiser.fundraiser_title,
                description: fundraiser.fundraiser_description,
                main_image: fundraiser.fundraiser_main_image,
                collected_amount: parseFloat(fundraiser.fundraiser_collected_amount),
                target_amount: parseFloat(fundraiser.fundraiser_target_amount),
                status: fundraiser.fundraiser_status,
                is_urgent: fundraiser.is_urgent,
                categories: fundraiser.fundraiser_categories || [],
                location: locationString,
                user: {
                    id: fundraiser.user?.id,
                    full_name: fundraiser.user?.full_name || 'Unknown User',
                    user_image: fundraiser.user?.user_image || '/assets/image/Fundraiser-Page/header-sec/man-profile.png',
                    email: fundraiser.user?.email,
                    user_type: fundraiser.user?.user_type,
                },
                progress_percentage: Math.min(100, Math.round((parseFloat(fundraiser.fundraiser_collected_amount) / parseFloat(fundraiser.fundraiser_target_amount)) * 100))
            };
            
            formattedFundraisers.push(formattedFundraiser);
        }

        return formattedFundraisers;
    } catch (error) {
        console.error('💥 Error fetching trending fundraisers:', error);
        return [];
    }
}

async function getTopFundraisersByTarget() {
    try {
        console.log('📊 Fetching top 5 fundraisers by target amount...');
        
        const topFundraisers = await Fundraiser.findAll({
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'full_name', 'user_image', 'email', 'location']
            }],
            order: [['fundraiser_target_amount', 'DESC']],
            limit: 5
        });

        console.log(`✅ Found ${topFundraisers.length} top fundraisers`);
        
        const formattedFundraisers = [];
        
        for (const fundraiser of topFundraisers) {
            let locationString = 'Unknown Location';
            
            if (fundraiser.user && fundraiser.user.location) {
                locationString = await getLocationFromCoordinates(fundraiser.user.location);
            }
            
            const formattedFundraiser = {
                id: fundraiser.fundraiser_id,
                public_id: fundraiser.public_id,
                title: fundraiser.fundraiser_title,
                description: fundraiser.fundraiser_description,
                main_image: fundraiser.fundraiser_main_image,
                collected_amount: parseFloat(fundraiser.fundraiser_collected_amount),
                target_amount: parseFloat(fundraiser.fundraiser_target_amount),
                status: fundraiser.fundraiser_status,
                is_urgent: fundraiser.is_urgent,
                categories: fundraiser.fundraiser_categories || [],
                location: locationString,
                user: {
                    id: fundraiser.user?.id,
                    full_name: fundraiser.user?.full_name || 'Unknown User',
                    user_image: fundraiser.user?.user_image || '/assets/image/Fundraiser-Page/header-sec/man-profile.png',
                    email: fundraiser.user?.email,
                    user_type: fundraiser.user?.user_type,
                },
                progress_percentage: Math.min(100, Math.round((parseFloat(fundraiser.fundraiser_collected_amount) / parseFloat(fundraiser.fundraiser_target_amount)) * 100))
            };
            
            formattedFundraisers.push(formattedFundraiser);
        }

        return formattedFundraisers;
    } catch (error) {
        console.error('💥 Error fetching top fundraisers:', error);
        return [];
    }
}

async function getTop10Donors() {
    try {
        console.log('📊 Fetching top 10 donors...');
        
        const topDonors = await UserRankPoint.findAll({
            include: [{
                model: User,
                as: 'User',
                attributes: ['id', 'full_name', 'user_image', 'user_type', 'phone_number', 'gender', 'location'],
                where: {
                    user_type: 'donor'
                }
            }],
            order: [['userPoints', 'DESC']],
            limit: 10
        });

        console.log(`✅ Found ${topDonors.length} top donors`);
        
        const formattedDonors = topDonors.map((donor, index) => ({
            rank: index + 1,
            userId: donor.userId,
            userEmail: donor.userEmail,
            fullName: donor.fullName || donor.User?.full_name || 'Unknown User',
            userImage: donor.userImage || donor.User?.user_image || '/assets/image/Fundraiser-Page/header-sec/man-profile.png',
            userPoints: donor.userPoints || 0,
            rankName: donor.rankName || 'No Rank',
            rankImage: donor.rankImage || '/assets/image/Account-Page/rank.png',
            rankColor: donor.rankColor || '#eee',
            phoneNumber: donor.User?.phone_number || 'Not provided',
            gender: donor.User?.gender || 'Not specified',
            userType: donor.User?.user_type || 'donor',
        }));

        return formattedDonors;
    } catch (error) {
        console.error('💥 Error fetching top 10 donors:', error);
        return [];
    }
}

async function getTop10DonorsSimple() {
    try {
        console.log('📊 Fetching top 10 donors (simple approach)...');
        
        const topDonors = await UserRankPoint.findAll({
            order: [['userPoints', 'DESC']],
            limit: 10
        });

        console.log(`✅ Found ${topDonors.length} top donors`);
        
        const formattedDonors = topDonors.map((donor, index) => ({
            rank: index + 1,
            userId: donor.userId,
            userEmail: donor.userEmail,
            fullName: donor.fullName || 'Unknown User',
            userImage: donor.userImage || '/assets/image/Fundraiser-Page/header-sec/man-profile.png',
            userPoints: donor.userPoints || 0,
            photoBase64: donor.photoBase64 || '/assets/image/Fundraiser-Page/header-sec/man-profile.png',
            rankName: donor.rankName || 'No Rank',
            rankImage: donor.rankImage || '/assets/image/Account-Page/rank.png',
            rankColor: donor.rankColor || '#eee'
        }));

        return formattedDonors;
    } catch (error) {
        console.error('💥 Error fetching top 10 donors:', error);
        return [];
    }
}

async function getTop5faqs() {
    try {
        const recentFAQs = await FAQ.findAll({
            order: [['created_at', 'DESC']],
            limit: 5
        });
        
        return recentFAQs;
        
    } catch (error) {
        console.error('Error loading FAQs:', error);
        return [];
    }
}

async function getAlmostCompleteFundraisers() {
    try {
        console.log('📊 Fetching top 3 almost complete fundraisers...');
        
        const almostCompleteFundraisers = await Fundraiser.findAll({
            where: {
                fundraiser_status: 'incompleted',
                fundraiser_collected_amount: {
                    [Sequelize.Op.gt]: 0
                }
            },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'full_name', 'user_image', 'email', 'location','user_type']
            }],
            order: [
                [Sequelize.literal('(fundraiser_collected_amount / fundraiser_target_amount)'), 'DESC']
            ],
            limit: 3
        });

        console.log(`✅ Found ${almostCompleteFundraisers.length} almost complete fundraisers`);
        
        const formattedFundraisers = [];
        
        for (const fundraiser of almostCompleteFundraisers) {
            let locationString = 'Unknown Location';
            
            if (fundraiser.user && fundraiser.user.location) {
                locationString = await getLocationFromCoordinates(fundraiser.user.location);
            }
            
            const collected = parseFloat(fundraiser.fundraiser_collected_amount);
            const target = parseFloat(fundraiser.fundraiser_target_amount);
            const progressPercentage = Math.min(100, Math.round((collected / target) * 100));
            
            const formattedFundraiser = {
                id: fundraiser.fundraiser_id,
                public_id: fundraiser.public_id,
                title: fundraiser.fundraiser_title,
                description: fundraiser.fundraiser_description,
                main_image: fundraiser.fundraiser_main_image,
                collected_amount: collected,
                target_amount: target,
                status: fundraiser.fundraiser_status,
                is_urgent: fundraiser.is_urgent,
                categories: fundraiser.fundraiser_categories || [],
                location: locationString,
                user: {
                    id: fundraiser.user?.id,
                    full_name: fundraiser.user?.full_name || 'Unknown User',
                    user_image: fundraiser.user?.user_image || '/assets/image/Fundraiser-Page/header-sec/man-profile.png',
                    email: fundraiser.user?.email,
                    user_type:fundraiser.user.user_type,
                },
                progress_percentage: progressPercentage,
                collected_amount_formatted: collected.toLocaleString('en'),
                target_amount_formatted: target.toLocaleString('en'),
                progress_width: `${progressPercentage}%`
            };
            formattedFundraisers.push(formattedFundraiser);
        }
        return formattedFundraisers;
    } catch (error) {
        console.error('💥 Error fetching almost complete fundraisers:', error);
        return [];
    }
}

function numberToWords(num) {
  const ones = ["zero","one","two","three","four","five","six","seven","eight","nine"];
  const teens = ["ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
  const tens = ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];

  if (num < 10) return ones[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) {
    return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? "-" + ones[num % 10] : "");
  }
  return num.toString();
}

exports.gotoindex = async (req, res) => {
    try {
        console.log('🏠 Loading index page...');
        
        const isLogoutRedirect = req.query.logout === 'true';
        const isLogoutError = req.query.logout === 'error';
        
        if (isLogoutRedirect) {
            console.log('🔓 Logout redirect detected - destroying session');
            // Force session to be considered invalid on logout redirect
            if (req.session) {
                await new Promise((resolve, reject) => {
                    req.session.destroy((err) => {
                        if (err) {
                            console.error('❌ Session destroy error during logout redirect:', err);
                            reject(err);
                        } else {
                            console.log('✅ Session destroyed on logout redirect');
                            resolve();
                        }
                    });
                });
                // Also clear the cookie explicitly
                res.clearCookie('najdah.sid', { path: '/' });
            }
        }
        
        if (isLogoutError) {
            console.log('⚠️ Logout error redirect detected');
        }

        const [
            banners,
            topDonors,
            topFundraisers,
            almostCompleteFundraisers,
            recentFAQs,
            recentWaitingRequesters
        ] = await Promise.all([
            (async () => {
                // Get manually selected banners first
                let selectedBanners = await EmergencyReliefBanner.findAll({
                    where: { selected_for_home: true },
                    order: [['created_at', 'DESC']],
                    limit: 4
                });

                // Auto-fill with latest if less than 4 selected
                if (selectedBanners.length < 4) {
                    const remainingCount = 4 - selectedBanners.length;
                    const existingIds = selectedBanners.map(b => b.id);
                    
                    const autoFill = await EmergencyReliefBanner.findAll({
                        where: {
                            id: { [Sequelize.Op.notIn]: existingIds.length > 0 ? existingIds : [0] },
                            selected_for_home: false
                        },
                        order: [['created_at', 'DESC']],
                        limit: remainingCount
                    });
                    
                    selectedBanners = [...selectedBanners, ...autoFill];
                }

                return selectedBanners.map(banner => ({
                    ...banner.dataValues,
                    idText: numberToWords(banner.id),
                    date: moment(banner.date).format("dddd, MMMM Do YYYY, h:mm A")
                }));
            })(),
            
            getTop10DonorsSimple(),
            
            getTopTrendingFundraisers(),
            
            getAlmostCompleteFundraisers(),
            
            (async () => {
                return await FAQ.findAll({
                    order: [['created_at', 'DESC']],
                    limit: 5
                });
            })(),
            
            getRecentWaitingRequesters(req)
        ]);

                // After potential session destroy, recheck authentication
        const isAuthenticated = req.isAuthenticated?.() ?? false;
        console.log('🔐 isAuthenticated check result:', isAuthenticated, 'isLogoutRedirect:', isLogoutRedirect);
        let user = null;

        if (isAuthenticated && req.user) {
            user = {
                id: req.user.id,
                email: req.user.email,
                full_name: req.user.full_name,
                user_type: req.user.user_type,
                user_image: req.user.user_image || '/assets/image/Fundraiser-Page/header-sec/man-profile.png',
                phone_number: req.user.phone_number,
                gender: req.user.gender,
                is_verified: req.user.is_verified,
                created_at: req.user.created_at
            };
            console.log('✅ User authenticated from session:', {
                email: user.email,
                user_type: user.user_type,
                has_image: !!req.user.user_image
            });
        } else {
            console.log('ℹ️ No active session');
        }

        res.render("site/index", {
            banners,
            topDonors,
            topFundraisers,
            almostCompleteFundraisers,
            recentFAQs,
            recentWaitingRequesters,
            title: 'Home - Solidarity',
            currentPage: 'home',
            isAuthenticated: isAuthenticated,
            user: user,
            isLogoutRedirect: isLogoutRedirect,
            isLogoutError: isLogoutError
        });
        
    } catch (error) {
        console.error('💥 Error loading index page:', error);
        
        res.render("site/index", {
            banners: [],
            topDonors: [],
            topFundraisers: [],
            almostCompleteFundraisers: [],
            recentFAQs: [],
            recentWaitingRequesters: [],
            title: 'Home - Solidarity',
            currentPage: 'home',
            isAuthenticated: false,
            user: null,
            isLogoutRedirect: false,
            isLogoutError: false
        });
    }
};