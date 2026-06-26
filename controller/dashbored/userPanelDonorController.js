const User = require('../../models/User');
const Rank = require('../../models/Rank');
const UserRankPoint = require('../../models/UserRankPoint');
const RankAssignmentService = require('../../services/rankAssignmentService');
const { getLocationFromCoordinates } = require('../../utils/geolocation');

async function getAllRanks() {
    try {
        console.log('📊 Fetching all ranks from database...');
        
        const ranks = await Rank.findAll({
            order: [['minimumPoints', 'ASC']]
        });
        
        console.log(`✅ Found ${ranks.length} ranks`);
        
        const formattedRanks = ranks.map(rank => ({
            rank_id: rank.rankId,
            rank_name: rank.rankName || 'Unnamed Rank',
            rank_description: rank.rankDescription || 'No description available',
            minimum_points: rank.minimumPoints || 0,
            maximum_points: rank.maximumPoints || 0,
            rank_image: rank.rankImage || '/assets/image/Account-Page/rank.png',
            reward_name: rank.rewardName || 'No reward',
            reward_image: rank.rewardImage || '/assets/image/User-Panel-Donor-Page/iphone.png',
            rank_color: rank.rankColor || '#000',
            num_of_users_in_rank: rank.numOfUsersInRank || 0
        }));
        
        return formattedRanks;
    } catch (error) {
        console.error('💥 Error fetching ranks:', error);
        return [];
    }
}

async function getDatabaseUser(req) {
    try {
        if (req.user && req.user.id) {
            console.log('🔍 Looking for user with id:', req.user.id);
            
            const dbUser = await User.findByPk(req.user.id);
            
            if (dbUser) {
                console.log('✅ User found in database:', dbUser.toJSON());
                return dbUser;
            } else {
                console.log('❌ User not found in database');
                return null;
            }
        }
        return null;
    } catch (error) {
        console.error('💥 Error getting database user:', error);
        return null;
    }
}

function formatBirthDate(birthDate) {
    if (!birthDate) return 'Not provided';
    
    try {
        if (birthDate instanceof Date) {
            return birthDate.toLocaleDateString();
        } else if (typeof birthDate === 'string') {
            return new Date(birthDate).toLocaleDateString();
        } else {
            return String(birthDate);
        }
    } catch (error) {
        return String(birthDate);
    }
}

function formatUserData(dbUser) {
    const userData = {
        id: dbUser?.id || 'Unknown',
        email: dbUser?.email || 'Not provided',
        name: dbUser?.full_name || dbUser?.name || 'User',
        phone_number: dbUser?.phone_number || dbUser?.phone || 'Not provided',
        gender: dbUser?.gender || 'Not provided',
        birth_date: formatBirthDate(dbUser?.birth_date),
        address: dbUser?.address || 'Not provided',
        city: dbUser?.city || '',
        country: dbUser?.country || '',
        user_image: dbUser?.user_image || dbUser?.userImage || null,
        user_type: dbUser?.user_type || 'donor',
        location: dbUser?.location || null
    };
    
    console.log('📦 Formatted user data:', userData);
    return userData;
}

async function getUserRankData(userId) {
    try {
        console.log('🎯 Fetching user rank data for user:', userId);
        
        const userRankPoint = await UserRankPoint.findOne({
            where: { userId: userId }
        });
        
        if (userRankPoint) {
            console.log('✅ User rank data found');
            
            return {
                userPoints: userRankPoint.userPoints || 0,
                rankName: userRankPoint.rankName || 'No Rank',
                rankImage: userRankPoint.rankImage || '/assets/image/Account-Page/rank.png',
                currentRankId: userRankPoint.currentRankId,
                rewardName: userRankPoint.rewardName || 'Donation Medal',
                rewardImage: userRankPoint.rewardImage || '/assets/image/Home-Page/top-donor/king-of-donations-medal.png',
                rankColor: userRankPoint.rankColor || '#000'
            };
        } else {
            console.log('⚠️ No rank data found for user:', userId);
            
            try {
                const dbUser = await User.findOne({ where: { id: userId } });
                if (dbUser && dbUser.user_type === 'donor') {
                    const initialized = await RankAssignmentService.initializeSingleDonor(dbUser);
                    
                    if (initialized) {
                        const newUserRankPoint = await UserRankPoint.findOne({
                            where: { userId: userId }
                        });
                        
                        if (newUserRankPoint) {
                            return {
                                userPoints: newUserRankPoint.userPoints || 0,
                                rankName: newUserRankPoint.rankName || 'No Rank',
                                rankImage: newUserRankPoint.rankImage || '/assets/image/Account-Page/rank.png',
                                currentRankId: newUserRankPoint.currentRankId,
                                rewardName: newUserRankPoint.rewardName || 'Donation Medal',
                                rewardImage: newUserRankPoint.rewardImage || '/assets/image/Home-Page/top-donor/king-of-donations-medal.png',
                                rankColor: newUserRankPoint.rankColor || '#000'
                            };
                        }
                    }
                }
            } catch (initError) {
                console.error('💥 Error initializing user rank data:', initError);
            }
            
            return {
                userPoints: 0,
                rankName: 'No Rank',
                rankImage: '/assets/image/Account-Page/rank.png',
                currentRankId: null,
                rewardName: 'Donation Medal',
                rewardImage: '/assets/image/Home-Page/top-donor/king-of-donations-medal.png',
                rankColor: '#000',
            };
        }
    } catch (error) {
        console.error('💥 Error fetching user rank data:', error);
        return {
            userPoints: 0,
            rankName: 'No Rank',
            rankImage: '/assets/image/Account-Page/rank.png',
            currentRankId: null,
            rewardName: 'Donation Medal',
            rewardImage: '/assets/image/Home-Page/top-donor/king-of-donations-medal.png',
            rankColor: '#000'
        };
    }
}

class UserPanelDonorController {
    async getDonorPanel(req, res) {
        try {
            console.log('🚀 START: Loading userPanelDonor page');
            console.log('👤 Session user data:', req.user);
            
            if (!req.user || !req.user.id) {
                console.log('❌ No user authenticated, redirecting to login');
                return res.redirect('/register');
            }

            const dbUser = await getDatabaseUser(req);
            const ranks = await getAllRanks();
            
            if (!dbUser) {
                console.log('❌ User not found in database');
                return res.render('dashboard/user-panel-donor', {
                    title: 'User Panel - Donor',
                    user: null,
                    userLocation: 'Not provided',
                    userRankData: null,
                    ranks: ranks,
                    currentPage: 'donor-panel',
                    errorMessage: 'User not found. Please complete your registration.'
                });
            }

            const formattedUser = formatUserData(dbUser);
            const userLocation = dbUser?.location 
              ? await getLocationFromCoordinates(dbUser.location) 
              : 'Not provided';
            
            let userRankData = null;
            if (dbUser && dbUser.id) {
                userRankData = await getUserRankData(dbUser.id);
            }
            
            console.log('🎯 Final data for template:', {
                name: formattedUser.name,
                email: formattedUser.email,
                hasImage: !!formattedUser.user_image,
                location: userLocation,
                userRankData: userRankData,
                ranksCount: ranks.length
            });

            res.render('dashboard/user-panel-donor', {
                title: 'User Panel - Donor',
                user: formattedUser,
                userLocation: userLocation,
                userRankData: userRankData,
                ranks: ranks,
                currentPage: 'donor-panel',
                successMessage: null,
                errorMessage: null
            });
            
        } catch (error) {
            console.error('💥 CRITICAL ERROR loading user donor panel:', error);
            res.render('dashboard/user-panel-donor', {
                title: 'User Panel - Donor',
                user: null,
                userLocation: 'Not provided',
                userRankData: null,
                ranks: [],
                currentPage: 'donor-panel',
                successMessage: null,
                errorMessage: 'Error loading page. Please try again later.'
            });
        }
    }

    async updateProfile(req, res) {
        try {
            console.log('📝 Processing profile update request');
            
            if (!req.user || !req.user.id) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'User not authenticated.' 
                });
            }

            const { full_name, phone_number, gender, birth_date, address, city, country } = req.body;
            
            console.log('📋 Update data received:', {
                full_name, phone_number, gender, birth_date, address, city, country
            });

            const updateData = {
                full_name,
                phone_number,
                gender,
                birth_date,
                address,
                city,
                country,
                updated_at: new Date()
            };

            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) {
                    delete updateData[key];
                }
            });

            const [updatedCount] = await User.update(updateData, {
                where: { id: req.user.id }
            });

            if (updatedCount === 0) {
                console.log('⚠️ No user found to update in PostgreSQL');
            } else {
                console.log('✅ PostgreSQL update successful');
            }

            // ── Firestore update disabled ─────────────────────────────────────
            // try {
            //     const { db } = require("../../config/firebase-admin");
            //     await db.collection("users").doc(req.user.id).update({
            //         ...updateData,
            //         updatedAt: new Date()
            //     });
            //     console.log('✅ Firestore update successful');
            // } catch (firestoreError) {
            //     console.error('⚠️ Firestore update failed:', firestoreError);
            // }

            res.json({
                success: true,
                message: 'Profile updated successfully!'
            });
            
        } catch (error) {
            console.error('💥 Error updating profile:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating profile. Please try again.'
            });
        }
    }

    async getCurrentUserRank(req, res) {
        try {
            console.log('📡 API: Fetching current user rank data');
            
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
            }

            const dbUser = await getDatabaseUser(req);
            
            if (!dbUser || !dbUser.id) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found in database'
                });
            }

            const userRankData = await getUserRankData(dbUser.id);
            
            res.json({
                success: true,
                data: userRankData
            });
            
        } catch (error) {
            console.error('💥 API Error fetching user rank data:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching user rank data',
                data: {
                    userPoints: 0,
                    rankName: 'Error Loading',
                    rankImage: '/assets/image/Account-Page/rank.png',
                    currentRankId: null
                }
            });
        }
    }

    async debugUserRank(req, res) {
        try {
            const userId = req.params.userId;
            const userRankPoint = await UserRankPoint.findOne({
                where: { userId: parseInt(userId) }
            });
            
            const user = await User.findOne({
                where: { id: parseInt(userId) }
            });
            
            const rankData = await getUserRankData(parseInt(userId));
            
            res.json({
                userId: userId,
                userExists: !!user,
                userRankPointExists: !!userRankPoint,
                rawUserRankPoint: userRankPoint ? userRankPoint.toJSON() : null,
                userInfo: user ? {
                    id: user.id,
                    email: user.email,
                    user_type: user.user_type
                } : null,
                processedRankData: rankData
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async debugCurrentUserRank(req, res) {
        try {
            if (!req.user || !req.user.id) {
                return res.json({ error: 'No authenticated user' });
            }
            
            const dbUser = await getDatabaseUser(req);
            
            if (!dbUser) {
                return res.json({ error: 'User not found in database' });
            }
            
            const rankData = await getUserRankData(dbUser.id);
            
            res.json({
                authenticatedUser: {
                    id: req.user.id,
                    email: req.user.email
                },
                databaseUser: {
                    id: dbUser.id,
                    email: dbUser.email
                },
                rankData: rankData
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new UserPanelDonorController();