const { Op } = require('sequelize');
const sequelize = require('../../config/dbSQL');
const Rank = require('../../models/Rank');
const User = require('../../models/User');
const UserRankPoint = require('../../models/UserRankPoint');
const uploadRankImages = require('../../middelware/uploadRankImages');
const rankCountService = require('../../services/RankCountService');

class RankController {
    async addRank(req, res) {
        try {
            uploadRankImages(req, res, async (err) => {
                if (err) {
                    console.error('File upload error:', err);
                    return res.status(400).json({
                        success: false,
                        message: err.message
                    });
                }
                try {
                    const {
                        rankName,
                        rankDescription,
                        minimumPoints,
                        maximumPoints,
                        rewardName
                    } = req.body;

                    const rankImagePath = req.files?.RankImage ? 
                        `/uploads/ranks/${req.files.RankImage[0].filename}` : '';
                    
                    const rewardImagePath = req.files?.rewardImage ? 
                        `/uploads/ranks/${req.files.rewardImage[0].filename}` : '';

                    const newRank = await Rank.create({
                        rankName: rankName || '',
                        rankDescription: rankDescription || '',
                        minimumPoints: parseInt(minimumPoints) || 0,
                        maximumPoints: parseInt(maximumPoints) || 0,
                        rankImage: rankImagePath,
                        rewardName: rewardName || '',
                        rewardImage: rewardImagePath,
                        numOfUsersInRank: 0
                    });

                    res.json({
                        success: true,
                        message: 'Rank added successfully',
                        rankId: newRank.rankId
                    });
                } catch (error) {
                    console.error('Error adding rank:', error);
                    res.status(500).json({
                        success: false,
                        message: 'Error adding rank: ' + error.message
                    });
                }
            });
        } catch (error) {
            console.error('Error in addRank:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error: ' + error.message
            });
        }
    }

    async getRanks(req, res) {
        try {
            const ranks = await Rank.findAll({
                order: [['minimum_points', 'ASC']]
            });
            
            const ranksWithFullUrls = ranks.map(rank => ({
                ...rank.toJSON(),
                rankImage: rank.rankImage ? `${req.protocol}://${req.get('host')}${rank.rankImage}` : null,
                rewardImage: rank.rewardImage ? `${req.protocol}://${req.get('host')}${rank.rewardImage}` : null
            }));
            
            res.json({
                success: true,
                data: ranksWithFullUrls
            });
        } catch (error) {
            console.error('Error fetching ranks:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching ranks'
            });
        }
    }

    async updateRank(req, res) {
        try {
            uploadRankImages(req, res, async (err) => {
                if (err) {
                    return res.status(400).json({
                        success: false,
                        message: err.message
                    });
                }

                try {
                    const { rankId } = req.params;
                    const updateData = {};

                    if (req.body.rankName !== undefined) updateData.rankName = req.body.rankName;
                    if (req.body.rankDescription !== undefined) updateData.rankDescription = req.body.rankDescription;
                    if (req.body.minimumPoints !== undefined) updateData.minimumPoints = parseInt(req.body.minimumPoints);
                    if (req.body.maximumPoints !== undefined) updateData.maximumPoints = parseInt(req.body.maximumPoints);
                    if (req.body.rewardName !== undefined) updateData.rewardName = req.body.rewardName;

                    if (req.files?.RankImage) {
                        updateData.rankImage = `/uploads/ranks/${req.files.RankImage[0].filename}`;
                    }

                    if (req.files?.rewardImage) {
                        updateData.rewardImage = `/uploads/ranks/${req.files.rewardImage[0].filename}`;
                    }

                    const [updatedCount] = await Rank.update(updateData, {
                        where: { rankId: rankId }
                    });

                    if (updatedCount === 0) {
                        return res.status(404).json({
                            success: false,
                            message: 'Rank not found'
                        });
                    }

                    res.json({
                        success: true,
                        message: 'Rank updated successfully'
                    });
                } catch (error) {
                    console.error('Error updating rank:', error);
                    res.status(500).json({
                        success: false,
                        message: 'Error updating rank'
                    });
                }
            });
        } catch (error) {
            console.error('Error in updateRank:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    async updateAllRankUserCounts() {
        try {
            const result = await rankCountService.updateAllRankUserCounts();
            return result > 0;
        } catch (error) {
            console.error('❌ Error updating rank user counts:', error);
            return false;
        }
    }

    async updateRankUserCount(rankId) {
        try {
            const success = await rankCountService.updateRankUserCount(rankId);
            
            // ── Firestore sync disabled ─────────────────────────────────────
            // if (success) {
            //     const rank = await Rank.findByPk(rankId);
            //     if (rank && rank.firestoreDocId) {
            //         await admin.firestore().collection('ranks').doc(rank.firestoreDocId).update({
            //             numOfUsersInRank: rank.numOfUsersInRank,
            //             updatedAt: admin.firestore.FieldValue.serverTimestamp()
            //         });
            //         console.log(`✅ Updated Firestore for rank ${rank.rankName}`);
            //     }
            // }
            
            return success;
        } catch (error) {
            console.error(`❌ Error updating user count for rank ${rankId}:`, error);
            return false;
        }
    }

    async refreshRankCounts(req, res) {
        try {
            const result = await rankCountService.forceRefreshAllCounts();
            
            if (result.success) {
                res.json({
                    success: true,
                    message: result.message,
                    updatedCount: result.updatedCount
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            console.error('Error refreshing rank counts:', error);
            res.status(500).json({
                success: false,
                message: 'Error refreshing rank counts'
            });
        }
    }

    async getRankStatistics(req, res) {
        try {
            const statistics = await rankCountService.getRankStatistics();
            
            res.json({
                success: true,
                data: statistics
            });
        } catch (error) {
            console.error('Error getting rank statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting rank statistics'
            });
        }
    }

    async cleanupOrphanedRankPoints() {
        try {
            console.log('🔄 Cleaning up orphaned user rank points...');
            
            const orphanedByUser = await UserRankPoint.findAll({
                include: [{
                    model: User,
                    as: 'User',
                    required: false,
                    where: { id: null }
                }],
                where: {
                    '$User.id$': null
                }
            });

            const orphanedByRank = await UserRankPoint.findAll({
                include: [{
                    model: Rank,
                    as: 'Rank',
                    required: false,
                    where: { rankId: null }
                }],
                where: {
                    currentRankId: { [Op.ne]: null },
                    '$Rank.rankId$': null
                }
            });

            const totalOrphaned = orphanedByUser.length + orphanedByRank.length;
            
            if (totalOrphaned > 0) {
                const userRankPointIds = [
                    ...orphanedByUser.map(urp => urp.userRankPointId),
                    ...orphanedByRank.map(urp => urp.userRankPointId)
                ];
                
                await UserRankPoint.destroy({
                    where: {
                        userRankPointId: userRankPointIds
                    }
                });
                
                console.log(`✅ Cleaned up ${totalOrphaned} orphaned user rank points`);
            } else {
                console.log('✅ No orphaned user rank points found');
            }
            
            return totalOrphaned;
        } catch (error) {
            console.error('❌ Error cleaning up orphaned rank points:', error);
            return 0;
        }
    }

    async updateAllRankUserCountsSafe() {
        try {
            console.log('🔄 Safe: Updating user counts for all ranks...');
            
            const allRanks = await Rank.findAll();
            
            for (const rank of allRanks) {
                try {
                    const result = await sequelize.query(
                        `SELECT COUNT(*) as user_count 
                         FROM user_rank_points 
                         WHERE current_rank_id = $1`,
                        {
                            bind: [rank.rankId],
                            type: sequelize.QueryTypes.SELECT
                        }
                    );
                    
                    const userCount = parseInt(result[0].user_count) || 0;
                    
                    await Rank.update(
                        { numOfUsersInRank: userCount },
                        { where: { rankId: rank.rankId } }
                    );
                    
                    console.log(`✅ Rank ${rank.rankName}: ${userCount} users`);
                } catch (rankError) {
                    console.error(`❌ Error updating count for rank ${rank.rankId}:`, rankError.message);
                }
            }
            
            console.log('✅ All rank user counts updated successfully');
            return true;
        } catch (error) {
            console.error('❌ Error updating rank user counts:', error.message);
            return false;
        }
    }

    async updateRankUserCountSafe(rankId) {
        try {
            const numericRankId = parseInt(rankId);
            if (isNaN(numericRankId)) {
                console.log(`⚠️ Invalid rankId: ${rankId}`);
                return false;
            }
            
            const rank = await Rank.findByPk(numericRankId);
            if (!rank) {
                console.log(`⚠️ Rank ${numericRankId} not found, skipping count update`);
                return false;
            }
            
            const result = await sequelize.query(
                `SELECT COUNT(*) as user_count 
                 FROM user_rank_points 
                 WHERE current_rank_id = $1`,
                {
                    bind: [numericRankId],
                    type: sequelize.QueryTypes.SELECT
                }
            );
            
            const userCount = parseInt(result[0].user_count) || 0;
            
            await Rank.update(
                { numOfUsersInRank: userCount },
                { where: { rankId: numericRankId } }
            );
            
            console.log(`✅ Rank ${rank.rankName} user count updated to: ${userCount}`);
            return true;
        } catch (error) {
            console.error(`❌ Error updating user count for rank ${rankId}:`, error.message);
            return false;
        }
    }
}

module.exports = new RankController();