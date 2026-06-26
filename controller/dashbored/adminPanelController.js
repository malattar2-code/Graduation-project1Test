const Fundraiser = require("../../models/Fundraiser");
const User = require("../../models/User");
const Admin = require("../../models/Admin");          // ← NEW: PostgreSQL Admin model
const Rank = require("../../models/Rank");
const LedgerTransaction = require("../../models/LedgerTransaction");
const FundraiserBalance = require("../../models/FundraiserBalance");
const WithdrawRequest = require("../../models/WithdrawRequest");
const TransferLog = require("../../models/TransferLog");
const Category = require("../../models/Category");
const UserRankPoint = require("../../models/UserRankPoint");
const Complaint = require("../../models/Complaint");
const EmergencyReliefBanner = require("../../models/EmergencyReliefBanner");
const FAQ = require("../../models/FAQ");
const FundraiserForm = require("../../models/FundraiserForm");
const FundraiserRequest = require("../../models/FundraiserRequest");
const rankController = require("../dashbored/rankController");
const statisticsController = require("../dashbored/statisticsController");
const FundraisersVerificationRequest = require("../../models/FundraisersVerificationRequest");
const { getLocationFromCoordinates } = require("../../utils/geolocation"); // ← NEW
const { Op } = require('sequelize');
const Sequelize = require('../../config/dbSQL');

class AdminPanelController {
    async getAdminPanel(req, res) {
        try {
            const { page, limit, offset } = this.getPaginationParams(req);

            // Fetch paginated data for all tables
            const [
                allFundraisers,
                fundraisersCount,
                allCategories,
                categoriesCount,
                allRanks,
                allUserRankPoints,
                userRankPointsCount,
                allComplaints,
                complaintsCount,
                allForms,
                formsCount,
                allRequests,
                requestsCount
            ] = await Promise.all([
                // Fundraisers
                Fundraiser.findAll({
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['id', 'full_name', 'email']
                    }],
                    order: [['created_at', 'DESC']],
                    limit,
                    offset
                }),
                Fundraiser.count(),
                
                // Categories
                Category.findAll({
                    order: [['category_name', 'ASC']],
                    limit,
                    offset
                }),
                Category.count(),
                
                // Ranks (for count only, full table shown separately)
                Rank.findAll({ order: [['minimum_points', 'ASC']] }),
                
                // User Rank Points
                UserRankPoint.findAll({
                    include: [
                        { model: User, as: 'User', attributes: ['id', 'full_name', 'email', 'user_image'] },
                        { model: Rank, as: 'Rank', attributes: ['rankId', 'rankName', 'maximumPoints', 'rankImage'] }
                    ],
                    order: [['user_points', 'DESC']],
                    limit,
                    offset
                }),
                UserRankPoint.count(),
                
                // Complaints
                Complaint.findAll({
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['id', 'full_name', 'email', 'user_type']
                    }],
                    order: [['created_at', 'DESC']],
                    limit,
                    offset
                }).catch(() => Complaint.findAll({
                    order: [['created_at', 'DESC']],
                    limit,
                    offset
                })),
                Complaint.count().catch(() => 0),
                
                // Forms
                FundraiserForm.findAll({
                    order: [['created_at', 'DESC']],
                    limit,
                    offset
                }),
                FundraiserForm.count(),
                
                // Requests
                FundraiserRequest.findAll({
                    include: [{
                        model: User,
                        as: 'requester',
                        attributes: ['id', 'full_name', 'email'],
                        required: false
                    }],
                    order: [['created_at', 'DESC']],
                    limit,
                    offset
                }),
                FundraiserRequest.count()
            ]);

            // Format data (keeping existing formatters)
            const formattedComplaints = allComplaints.map(complaint => {
                const userData = complaint.user ? {
                    user_id: complaint.user.id,
                    user_email: complaint.user.email,
                    user_full_name: complaint.user.full_name
                } : {
                    user_id: complaint.user_id,
                    user_email: complaint.user_email,
                    user_full_name: complaint.user_full_name
                };
                return {
                    complaint_id: complaint.complaint_id,
                    complaint_content: complaint.complaint_content,
                    ...userData,
                    status: complaint.status,
                    created_at: complaint.created_at,
                    updated_at: complaint.updated_at
                };
            });

            const formattedFundraisers = allFundraisers.map(fundraiser => ({
                id: fundraiser.fundraiser_id,
                main_image: fundraiser.fundraiser_main_image,
                title: fundraiser.fundraiser_title,
                collected_amount: parseFloat(fundraiser.fundraiser_collected_amount),
                target_amount: parseFloat(fundraiser.fundraiser_target_amount),
                status: fundraiser.fundraiser_status,
                user_id: fundraiser.fundraiser_user_id,
                type: fundraiser.fundraiser_type,
                categories: fundraiser.fundraiser_categories || [],
                created_at: fundraiser.created_at,
                is_blocked: fundraiser.is_blocked || false,
                block_reason: fundraiser.block_reason || null,
                blocked_at: fundraiser.blocked_at || null
            }));

            const formattedCategories = allCategories.map(category => ({
                id: category.category_id,
                name: category.category_name,
                image: category.category_image,
                description: category.category_description,
                firebase_id: category.firebase_id,
                created_at: category.created_at
            }));

            const formattedRanks = allRanks.map(rank => ({
                rankId: rank.rankId,
                rankName: rank.rankName,
                minimumPoints: rank.minimumPoints,
                maximumPoints: rank.maximumPoints,
                rankImage: rank.rankImage,
                rewardName: rank.rewardName,
                rewardImage: rank.rewardImage,
                numOfUsersInRank: rank.numOfUsersInRank
            }));

            const formattedUserRankPoints = allUserRankPoints.map(urp => ({
                userRankPointId: urp.userRankPointId,
                userId: urp.userId,
                fullName: urp.fullName || (urp.User ? urp.User.full_name : 'N/A'),
                userImage: urp.userImage || (urp.User ? urp.User.user_image : ''),
                userPoints: urp.userPoints,
                currentRankId: urp.currentRankId,
                rankName: urp.rankName || (urp.Rank ? urp.Rank.rankName : 'N/A'),
                rankImage: urp.rankImage || (urp.Rank ? urp.Rank.rankImage : ''),
                maximumPoints: urp.Rank ? urp.Rank.maximumPoints : 0
            }));

            const formattedForms = allForms.map(form => ({
                id: form.id,
                fundraiser_id: form.fundraiser_id,
                user_id: form.user_id,
                target_requesters_number: form.target_requesters_number,
                current_requesters_number: form.current_requesters_number,
                schema: form.schema,
                created_at: form.created_at
            }));

            const formattedRequests = allRequests.map(req => ({
                id: req.id,
                form_id: req.form_id,
                fundraiser_id: req.fundraiser_id,
                user_id: req.user_id,
                requests: req.requests,
                request_status: req.request_status,
                request_rejected_reason: req.request_rejected_reason,
                created_at: req.created_at,
                user_name: req.requester ? req.requester.full_name : null,
                user_email: req.requester ? req.requester.email : null
            }));

            // Pagination contexts
            const pagination = {
                fundraisers: this.buildPaginationResponse(page, limit, fundraisersCount),
                categories: this.buildPaginationResponse(page, limit, categoriesCount),
                userRankPoints: this.buildPaginationResponse(page, limit, userRankPointsCount),
                complaints: this.buildPaginationResponse(page, limit, complaintsCount),
                forms: this.buildPaginationResponse(page, limit, formsCount),
                requests: this.buildPaginationResponse(page, limit, requestsCount)
            };

            res.render('dashboard/admin-panel', {
                fundraiserStats: {},
                userStats: {},
                rankStats: {},
                allFundraisers: formattedFundraisers,
                allCategories: formattedCategories,
                allRanks: formattedRanks,
                allUserRankPoints: formattedUserRankPoints,
                allComplaints: formattedComplaints,
                allForms: formattedForms,
                allRequests: formattedRequests,
                pagination,
                userChartData: [],
                fundraiserChartData: [],
                title: 'Admin Panel'
            });

        } catch (error) {
            console.error('Error in admin panel controller:', error);
            res.render('dashboard/admin-panel', {
                fundraiserStats: {},
                userStats: {},
                rankStats: {},
                allFundraisers: [],
                allCategories: [],
                allRanks: [],
                allUserRankPoints: [],
                allComplaints: [],
                allForms: [],
                allRequests: [],
                pagination: {},
                userChartData: [],
                fundraiserChartData: [],
                title: 'Admin Panel'
            });
        }
    }
    // ═════════════════════════════════════════════════════════════════
    // PAGINATION HELPER
    // ═════════════════════════════════════════════════════════════════
    getPaginationParams(req) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        return { page, limit, offset };
    }

    buildPaginationResponse(page, limit, totalCount) {
        const totalPages = Math.ceil(totalCount / limit);
        return {
            currentPage: page,
            totalPages,
            hasMore: page < totalPages,
            totalCount
        };
    }
    async deleteCategory(req, res) {
        const transaction = await Sequelize.transaction();
        
        try {
            const { id } = req.params;
            
            const category = await Category.findByPk(id, { transaction });
            if (!category) {
                await transaction.rollback();
                return res.status(404).json({ 
                    success: false, 
                    message: 'Category not found' 
                });
            }

            const categoryName = category.category_name;

            const fundraisersUsingCategory = await Fundraiser.count({
                where: {
                    fundraiser_categories: {
                        [Op.contains]: [categoryName]
                    }
                },
                transaction
            });

            if (fundraisersUsingCategory > 0) {
                const fundraisers = await Fundraiser.findAll({
                    where: {
                        fundraiser_categories: {
                            [Op.contains]: [categoryName]
                        }
                    },
                    transaction
                });

                for (const fundraiser of fundraisers) {
                    const updatedCategories = fundraiser.fundraiser_categories.filter(
                        cat => cat !== categoryName
                    );
                    
                    await fundraiser.update({
                        fundraiser_categories: updatedCategories
                    }, { transaction });
                }
            }

            await Category.destroy({
                where: { category_id: id },
                transaction
            });

            await transaction.commit();

            let message = 'Category deleted successfully';
            if (fundraisersUsingCategory > 0) {
                message = `Category deleted successfully. It was removed from ${fundraisersUsingCategory} fundraiser(s).`;
            }

            res.json({ 
                success: true, 
                message: message,
                data: {
                    categoryName: categoryName,
                    affectedFundraisers: fundraisersUsingCategory,
                    deletedCategoryId: id
                }
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Error deleting category:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error deleting category',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    async deleteRank(req, res) {
        try {
            const { id } = req.params;
            
            const rank = await Rank.findByPk(id);
            if (!rank) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Rank not found' 
                });
            }

            await UserRankPoint.update(
                { 
                    currentRankId: null,
                    rankName: null,
                    rankImage: null 
                },
                { 
                    where: { currentRankId: id } 
                }
            );

            await Rank.destroy({
                where: { rankId: id }
            });

            res.json({ 
                success: true, 
                message: 'Rank deleted successfully' 
            });

        } catch (error) {
            console.error('Error deleting rank:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error deleting rank' 
            });
        }
    }

        async getAllUserRankPoints(req, res) {
        try {
            const { page, limit, offset } = this.getPaginationParams(req);

            const { count, rows } = await UserRankPoint.findAndCountAll({
                include: [
                    {
                        model: User,
                        as: 'User',
                        attributes: ['id', 'full_name', 'email', 'user_image'],
                        required: false
                    },
                    {
                        model: Rank,
                        as: 'Rank',
                        attributes: ['rankId', 'rankName', 'maximumPoints', 'rankImage'],
                        required: false
                    }
                ],
                order: [['user_points', 'DESC']],
                limit,
                offset,
                distinct: true  // Important for correct count with includes
            });

            const formatted = rows.map(urp => ({
                userRankPointId: urp.userRankPointId,
                userId: urp.userId,
                fullName: urp.fullName || (urp.User ? urp.User.full_name : 'N/A'),
                userImage: urp.userImage || (urp.User ? urp.User.user_image : ''),
                userPoints: urp.userPoints || 0,
                currentRankId: urp.currentRankId,
                rankName: urp.rankName || (urp.Rank ? urp.Rank.rankName : 'N/A'),
                rankImage: urp.rankImage || (urp.Rank ? urp.Rank.rankImage : ''),
                maximumPoints: urp.Rank ? urp.Rank.maximumPoints : 0
            }));

            res.json({
                success: true,
                data: formatted,
                pagination: this.buildPaginationResponse(page, limit, count)
            });
        } catch (error) {
            console.error('Error fetching user rank points:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch user rank points' });
        }
    }

    async resetUserPoints(req, res) {
        try {
            const { id } = req.params;
            
            const userRankPoint = await UserRankPoint.findByPk(id);
            if (!userRankPoint) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'User rank points record not found' 
                });
            }

            await UserRankPoint.update(
                { userPoints: 0 },
                { where: { userRankPointId: id } }
            );

            res.json({ 
                success: true, 
                message: 'User points reset to 0 successfully' 
            });

        } catch (error) {
            console.error('Error resetting user points:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error resetting user points' 
            });
        }
    }

    async deleteUserRankPoints(req, res) {
        try {
            const { id } = req.params;
            
            const userRankPoint = await UserRankPoint.findByPk(id);
            if (!userRankPoint) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'User rank points record not found' 
                });
            }

            await UserRankPoint.destroy({
                where: { userRankPointId: id }
            });

            res.json({ 
                success: true, 
                message: 'User rank points deleted successfully' 
            });

        } catch (error) {
            console.error('Error deleting user rank points:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error deleting user rank points' 
            });
        }
    }

    async refreshRankCounts(req, res) {
        try {
            const allRanks = await Rank.findAll();
            let updatedCount = 0;
            
            for (const rank of allRanks) {
                const userCount = await UserRankPoint.count({
                    where: { currentRankId: rank.rankId }
                });
                
                if (rank.numOfUsersInRank !== userCount) {
                    await rank.update({ numOfUsersInRank: userCount });
                    updatedCount++;
                }
            }
            
            res.json({ 
                success: true, 
                message: `Rank counts refreshed successfully. ${updatedCount} ranks updated.` 
            });
            
        } catch (error) {
            console.error('Error refreshing rank counts:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error refreshing rank counts' 
            });
        }
    }

    /* ─── NEW METHODS MOVED FROM ROUTES ─── */

    async deleteFundraiser(req, res) {
        const transaction = await Sequelize.transaction();
        try {
            const fundraiserId = req.params.id;
            const fundraiser = await Fundraiser.findByPk(fundraiserId, { transaction });
            
            if (!fundraiser) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Fundraiser not found' });
            }
            
            // Find all forms associated with this fundraiser
            const forms = await FundraiserForm.findAll({
                where: { fundraiser_id: fundraiserId },
                transaction
            });

            // Delete associated verification request if exists
            await FundraisersVerificationRequest.destroy({
                where: { fundraiser_id: fundraiserId },
                transaction
            });
            
            const formIds = forms.map(f => f.id);
            
            // Delete all requests associated with these forms
            if (formIds.length > 0) {
                await FundraiserRequest.destroy({
                    where: { form_id: { [Op.in]: formIds } },
                    transaction
                });
            }
            
            // Also delete any requests directly linked to this fundraiser
            await FundraiserRequest.destroy({
                where: { fundraiser_id: fundraiserId },
                transaction
            });
            
            // Delete all forms associated with this fundraiser
            await FundraiserForm.destroy({
                where: { fundraiser_id: fundraiserId },
                transaction
            });
            
            // Finally delete the fundraiser itself
            await fundraiser.destroy({ transaction });
            
            await transaction.commit();
            
            res.json({ 
                message: 'Fundraiser and all associated forms and requests deleted successfully',
                deletedFormsCount: forms.length
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error deleting fundraiser:', error);
            res.status(500).json({ error: 'Failed to delete fundraiser' });
        }
    }

    async addTrendCategory(req, res) {
        try {
            const fundraiserId = req.params.id;
            const fundraiser = await Fundraiser.findByPk(fundraiserId);
            
            if (!fundraiser) {
                return res.status(404).json({ error: 'Fundraiser not found' });
            }
            
            const currentCategories = fundraiser.fundraiser_categories || [];
            
            if (currentCategories.includes('trend')) {
                return res.status(400).json({ error: 'Fundraiser already has "trend" category' });
            }
            
            if (currentCategories.length >= 4) {
                return res.status(400).json({ error: 'Maximum 4 categories allowed' });
            }
            
            const updatedCategories = [...currentCategories, 'trend'];
            await fundraiser.update({ fundraiser_categories: updatedCategories });
            
            res.json({
                message: 'Trend category added successfully',
                categories: updatedCategories
            });
        } catch (error) {
            console.error('Error adding trend category:', error);
            res.status(500).json({ error: 'Failed to add trend category' });
        }
    }

    async removeTrendCategory(req, res) {
        try {
            const fundraiserId = req.params.id;
            const fundraiser = await Fundraiser.findByPk(fundraiserId);
            
            if (!fundraiser) {
                return res.status(404).json({ error: 'Fundraiser not found' });
            }
            
            const currentCategories = fundraiser.fundraiser_categories || [];
            
            if (!currentCategories.includes('trend')) {
                return res.status(400).json({ error: 'Fundraiser does not have "trend" category' });
            }
            
            const updatedCategories = currentCategories.filter(cat => cat !== 'trend');
            await fundraiser.update({ fundraiser_categories: updatedCategories });
            
            res.json({
                message: 'Trend category removed successfully',
                categories: updatedCategories
            });
        } catch (error) {
            console.error('Error removing trend category:', error);
            res.status(500).json({ error: 'Failed to remove trend category' });
        }
    }

    async getMe(req, res) {
        try {
            const userId = req.user.id;

            const dbUser = await User.findByPk(userId);
            
            if (!dbUser) {
                return res.status(404).json({ message: "User not found" });
            }

            const userImage = dbUser.user_image || 
                             '/assets/image/Fundraiser-Page/header-sec/man-profile.png';

            res.json({
                id: dbUser.id,
                email: dbUser.email,
                name: dbUser.full_name || "No Name",
                userImage: userImage,
                phoneNumber: dbUser.phone_number || null,
                emailVerified: dbUser.email_verified || false,
                disabled: dbUser.disabled || false
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Server error" });
        }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // ✅ UPDATED: Now queries the PostgreSQL `admins` table instead of Firestore
    // ───────────────────────────────────────────────────────────────────────────
    async getAdminMe(req, res) {
        try {
            const userId = req.user.id;

            const adminUser = await Admin.findByPk(userId);

            if (!adminUser) {
                return res.status(404).json({ 
                    success: false,
                    message: "Admin account not found in system" 
                });
            }

            const adminImage = adminUser.user_image || 
                              '/assets/image/Fundraiser-Page/header-sec/man-profile.png';

            const adminName = adminUser.full_name || "Administrator";

            res.json({
                success: true,
                id: adminUser.id,
                email: adminUser.email,
                name: adminName,
                userImage: adminImage,
                role: adminUser.role || 'admin',
                is_active: adminUser.is_active !== false,
                phoneNumber: adminUser.phone_number || null,
                emailVerified: adminUser.email_verified || false,
                disabled: adminUser.disabled || false
            });
        } catch (err) {
            console.error("Error fetching admin data:", err);
            res.status(500).json({ 
                success: false,
                message: "Server error while fetching admin data" 
            });
        }
    }

    async getFundraiserStats(req, res) {
        try {
            const totalFundraisers = await Fundraiser.count();
            const completedFundraisers = await Fundraiser.count({
                where: { fundraiser_status: 'completed' }
            });
            const incompletedFundraisers = await Fundraiser.count({
                where: { fundraiser_status: 'incompleted' }
            });
            const waitingRequestersFundraisers = await Fundraiser.count({
                where: { fundraiser_status: 'Waiting_requesters' }
            });
            const createFormFundraisers = await Fundraiser.count({
                where: { fundraiser_status: 'create_form' }
            });
            const transferredFundraisers = await Fundraiser.count({
                where: { fundraiser_status: 'transferred' }
            });

            res.json({
                total: totalFundraisers,
                completed: completedFundraisers,
                incompleted: incompletedFundraisers,
                waiting_requesters: waitingRequestersFundraisers,
                create_form: createFormFundraisers,
                transferred: transferredFundraisers,
                completedPercentage: totalFundraisers > 0 ? Math.round((completedFundraisers / totalFundraisers) * 100) : 0,
                incompletedPercentage: totalFundraisers > 0 ? Math.round((incompletedFundraisers / totalFundraisers) * 100) : 0,
                waitingRequestersPercentage: totalFundraisers > 0 ? Math.round((waitingRequestersFundraisers / totalFundraisers) * 100) : 0,
                createFormPercentage: totalFundraisers > 0 ? Math.round((createFormFundraisers / totalFundraisers) * 100) : 0,
                transferredPercentage: totalFundraisers > 0 ? Math.round((transferredFundraisers / totalFundraisers) * 100) : 0
            });
        } catch (error) {
            console.error('Error fetching fundraiser stats:', error);
            res.status(500).json({ error: 'Failed to fetch statistics' });
        }
    }

    async getAdminCounts(req, res) {
        try {
            const [
                categoriesCount,
                ranksCount,
                eventsCount,
                faqsCount,
                complaintsCount
            ] = await Promise.all([
                Category.count(),
                Rank.count(),
                EmergencyReliefBanner.count(),
                FAQ.count(),
                Complaint.count()
            ]);

            res.json({
                categories: categoriesCount,
                ranks: ranksCount,
                events: eventsCount,
                faqs: faqsCount,
                complaints: complaintsCount
            });
        } catch (err) {
            console.error("Error getting counts:", err);
            res.status(500).json({ message: "Server error" });
        }
    }

    async banUser(req, res) {
        try {
            const { id } = req.params;
            const { reason = 'Manual ban by administrator' } = req.body;

            const [updatedCount] = await User.update(
                { 
                    is_banned: true,
                    ban_reason: reason 
                },
                { where: { id } }
            );

            if (updatedCount === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'User not found in database' 
                });
            }

            // Firebase Firestore sync disabled per requirements

            res.json({ 
                success: true, 
                message: 'User banned successfully'
            });
        } catch (error) {
            console.error('Error banning user:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Internal server error'
            });
        }
    }

    async unbanUser(req, res) {
        try {
            const { id } = req.params;

            const [updatedCount] = await User.update(
                { 
                    is_banned: false,
                    ban_reason: null 
                },
                { where: { id } }
            );

            if (updatedCount === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'User not found in database' 
                });
            }

            // Firebase Firestore sync disabled per requirements

            res.json({ 
                success: true, 
                message: 'User unbanned successfully'
            });
        } catch (error) {
            console.error('Error unbanning user:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Internal server error'
            });
        }
    }

    async blockFundraiser(req, res) {
        try {
            const fundraiserId = req.params.id;
            const { reason = 'Manual block by administrator' } = req.body;
            
            const fundraiser = await Fundraiser.findByPk(fundraiserId);
            
            if (!fundraiser) {
                return res.status(404).json({ error: 'Fundraiser not found' });
            }
            
            if (fundraiser.is_blocked) {
                return res.status(400).json({ error: 'Fundraiser is already blocked' });
            }
            
            await fundraiser.update({
                is_blocked: true,
                block_reason: reason,
                blocked_at: new Date()
            });
            
            // Firebase-to-PostgreSQL sync disabled per requirements
            
            res.json({
                message: 'Fundraiser blocked successfully',
                fundraiser: {
                    id: fundraiser.fundraiser_id,
                    is_blocked: true,
                    block_reason: reason
                }
            });
        } catch (error) {
            console.error('Error blocking fundraiser:', error);
            res.status(500).json({ error: 'Failed to block fundraiser' });
        }
    }

    async unblockFundraiser(req, res) {
        try {
            const fundraiserId = req.params.id;
            
            const fundraiser = await Fundraiser.findByPk(fundraiserId);
            
            if (!fundraiser) {
                return res.status(404).json({ error: 'Fundraiser not found' });
            }
            
            if (!fundraiser.is_blocked) {
                return res.status(400).json({ error: 'Fundraiser is not blocked' });
            }
            
            await fundraiser.update({
                is_blocked: false,
                block_reason: null,
                blocked_at: null
            });
            
            // Firebase-to-PostgreSQL sync disabled per requirements
            
            res.json({
                message: 'Fundraiser unblocked successfully',
                fundraiser: {
                    id: fundraiser.fundraiser_id,
                    is_blocked: false,
                    block_reason: null
                }
            });
        } catch (error) {
            console.error('Error unblocking fundraiser:', error);
            res.status(500).json({ error: 'Failed to unblock fundraiser' });
        }
    }

    async markUrgent(req, res) {
        try {
            const fundraiser = await Fundraiser.findByPk(req.params.id);
            if (!fundraiser) return res.status(404).json({ error: 'Fundraiser not found' });
            if (fundraiser.is_urgent) return res.status(400).json({ error: 'Already marked as urgent' });
            
            await fundraiser.update({ is_urgent: true });
            res.json({ success: true, message: 'Fundraiser marked as urgent', is_urgent: true });
        } catch (error) {
            console.error('Error marking urgent:', error);
            res.status(500).json({ error: 'Failed to mark fundraiser as urgent' });
        }
    }

    async unmarkUrgent(req, res) {
        try {
            const fundraiser = await Fundraiser.findByPk(req.params.id);
            if (!fundraiser) return res.status(404).json({ error: 'Fundraiser not found' });
            if (!fundraiser.is_urgent) return res.status(400).json({ error: 'Fundraiser is not marked as urgent' });
            
            await fundraiser.update({ is_urgent: false });
            res.json({ success: true, message: 'Fundraiser unmarked as urgent', is_urgent: false });
        } catch (error) {
            console.error('Error unmarking urgent:', error);
            res.status(500).json({ error: 'Failed to unmark fundraiser as urgent' });
        }
    }

    // 🔹 جميع المستخدمين (PostgreSQL)
    async findAllUsers(req, res) {
        try {
            const users = await User.findAll({
                attributes: { exclude: ['password', 'verification_code', 'verification_code_expires_at',
                    'password_reset_code', 'password_reset_expires_at'] },
                order: [['created_at', 'DESC']]
            });

            const usersList = users.map((user, index) => ({
                number: index + 1,
                id: user.id, // Using PostgreSQL id, not uid
                ...user.toJSON()
            }));

            res.json({ count: users.length, users: usersList });
        } catch (error) {
            console.error("Error fetching users:", error);
            res.status(500).json({ message: "فشل في جلب المستخدمين" });
        }
    }

    // 🔹 المستخدمين (Requesters) - PostgreSQL
    async requerterUser(req, res) {
        try {
            const users = await User.findAll({
                where: { user_type: 'requester' },
                attributes: { exclude: ['password', 'verification_code', 'verification_code_expires_at',
                    'password_reset_code', 'password_reset_expires_at'] },
                order: [['created_at', 'DESC']]
            });

            const list = await Promise.all(users.map(async (user, index) => {
                const userData = user.toJSON();
                let location = "غير معروف";

                try {
                    location = await getLocationFromCoordinates(userData.location);
                    if (location === 'Unknown Location' || location === 'Location unavailable') {
                        location = "غير معروف";
                    }
                } catch (err) {
                    console.error("خطأ في user.id =", userData.id, err);
                }

                return {
                    number: index + 1,
                    id: userData.id, // Using id, not uid
                    ...userData,
                    location
                };
            }));

            res.json({ count: users.length, users: list });
        } catch (error) {
            console.error("خطأ في requerterUser:", error);
            res.status(500).json({ message: "فشل في جلب البيانات" });
        }
    }

    // 🔹 المستخدمين (Donors) - PostgreSQL
    async donorUsers(req, res) {
        try {
            const users = await User.findAll({
                where: { user_type: 'donor' || 'Donor' },
                attributes: { exclude: ['password', 'verification_code', 'verification_code_expires_at',
                    'password_reset_code', 'password_reset_expires_at'] },
                order: [['created_at', 'DESC']]
            });

            const list = await Promise.all(users.map(async (user, index) => {
                const userData = user.toJSON();
                let location = "غير معروف";

                try {
                    location = await getLocationFromCoordinates(userData.location);
                    if (location === 'Unknown Location' || location === 'Location unavailable') {
                        location = "غير معروف";
                    }
                } catch (err) {
                    console.error("خطأ في user.id =", userData.id, err);
                }

                return {
                    number: index + 1,
                    id: userData.id, // Using id, not uid
                    ...userData,
                    location
                };
            }));

            res.json({ count: users.length, users: list });
        } catch (error) {
            console.error("خطأ في donorUsers:", error);
            res.status(500).json({ message: "فشل في جلب البيانات" });
        }
    }

    // 🔹 NEW: المستخدمين (Charity) - PostgreSQL
    async charityUsers(req, res) {
        try {
            const users = await User.findAll({
                where: { user_type: 'Charity' },
                attributes: { exclude: ['password', 'verification_code', 'verification_code_expires_at',
                    'password_reset_code', 'password_reset_expires_at'] },
                order: [['created_at', 'DESC']]
            });

            const list = await Promise.all(users.map(async (user, index) => {
                const userData = user.toJSON();

                // Use stored city/region/country fields first (fast, no external call)
                let location = [userData.city, userData.region, userData.country]
                    .filter(Boolean).join(', ') || null;

                // Only fall back to reverse-geocoding if location fields are empty
                if (!location && userData.location) {
                    try {
                        location = await getLocationFromCoordinates(userData.location);
                        if (location === 'Unknown Location' || location === 'Location unavailable') {
                            location = null;
                        }
                    } catch (err) {
                        console.error("خطأ في user.id =", userData.id, err);
                    }
                }

                return {
                    number: index + 1,
                    id: userData.id,
                    ...userData,
                    location: location || 'Unknown'
                };
            }));

            res.json({ count: users.length, users: list });
        } catch (error) {
            console.error("خطأ في charityUsers:", error);
            res.status(500).json({ message: "فشل في جلب بيانات الجمعيات الخيرية" });
        }
    }

    // 🔹 حذف مستخدم - PostgreSQL (Replaces Firebase)
    async deleteUser(req, res) {
        const id = req.params.id; // Using id, not uid
        if (!id) return res.status(400).json({ success: false, message: "User ID required" });

        const transaction = await Sequelize.transaction();
        
        try {
            // Find user first
            const user = await User.findByPk(id, { transaction });
            if (!user) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: "User not found" });
            }

            // Delete related data in PostgreSQL
            // Note: Adjust table names based on your actual schema
            const relatedTables = ['posts', 'requests', 'fundraisers', 'invoices'];
            
            for (const tableName of relatedTables) {
                try {
                    await Sequelize.query(
                        `DELETE FROM ${tableName} WHERE user_id = :id`,
                        { replacements: { id }, transaction }
                    );
                } catch (tableError) {
                    // Table might not exist, log and continue
                    console.warn(`Could not delete from ${tableName}:`, tableError.message);
                }
            }

            // Delete user rank points if exists
            await UserRankPoint.destroy({
                where: { userId: id },
                transaction
            }).catch(() => {});

            // Delete the user
            await User.destroy({
                where: { id },
                transaction
            });

            await transaction.commit();

            // Firebase Auth deletion disabled per requirements
            // await auth.deleteUser(uid).catch(() => {});

            return res.json({ success: true, message: "User deleted successfully" });
        } catch (error) {
            await transaction.rollback();
            console.error("Error deleting user:", error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
        /* ─── FORMS & REQUESTS MANAGEMENT ─── */

    async getAllForms(req, res) {
        try {
            const { page, limit, offset } = this.getPaginationParams(req);
            const { search, fundraiser_id, user_id } = req.query;
            
            const where = {};
            if (fundraiser_id) where.fundraiser_id = fundraiser_id;
            if (user_id) where.user_id = user_id;

            const { count, rows: forms } = await FundraiserForm.findAndCountAll({
                where,
                order: [['created_at', 'DESC']],
                limit,
                offset
            });

            const formattedForms = forms.map(form => ({
                id: form.id,
                fundraiser_id: form.fundraiser_id,
                user_id: form.user_id,
                target_requesters_number: form.target_requesters_number,
                current_requesters_number: form.current_requesters_number,
                schema: form.schema,
                created_at: form.created_at
            }));

            res.json({ 
                success: true, 
                data: formattedForms,
                pagination: this.buildPaginationResponse(page, limit, count)
            });
        } catch (error) {
            console.error('Error fetching forms:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch forms' });
        }
    }

    async getAllRequests(req, res) {
        try {
            const { page, limit, offset } = this.getPaginationParams(req);
            const { search, status, fundraiser_id } = req.query;
            
            const where = {};
            if (status) where.request_status = status;
            if (fundraiser_id) where.fundraiser_id = fundraiser_id;

            const { count, rows: requests } = await FundraiserRequest.findAndCountAll({
                where,
                include: [
                    {
                        model: User,
                        as: 'requester',
                        attributes: ['id', 'full_name', 'email'],
                        required: false
                    }
                ],
                order: [['created_at', 'DESC']],
                limit,
                offset
            });

            const formattedRequests = requests.map(req => ({
                id: req.id,
                form_id: req.form_id,
                fundraiser_id: req.fundraiser_id,
                user_id: req.user_id,
                requests: req.requests,
                request_status: req.request_status,
                request_rejected_reason: req.request_rejected_reason,
                created_at: req.created_at,
                user_name: req.requester ? req.requester.full_name : null,
                user_email: req.requester ? req.requester.email : null
            }));

            res.json({ 
                success: true, 
                data: formattedRequests,
                pagination: this.buildPaginationResponse(page, limit, count)
            });
        } catch (error) {
            console.error('Error fetching requests:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch requests' });
        }
    }

    async deleteForm(req, res) {
        const transaction = await Sequelize.transaction();
        try {
            const { id } = req.params;

            const form = await FundraiserForm.findByPk(id, { transaction });
            if (!form) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: 'Form not found' });
            }

            // Delete all related requests first (cascade)
            const deletedRequestsCount = await FundraiserRequest.destroy({
                where: { form_id: id },
                transaction
            });

            await FundraiserForm.destroy({
                where: { id },
                transaction
            });

            await transaction.commit();

            res.json({
                success: true,
                message: 'Form deleted successfully',
                deletedRequestsCount: deletedRequestsCount
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error deleting form:', error);
            res.status(500).json({ success: false, message: 'Failed to delete form' });
        }
    }

    async deleteRequest(req, res) {
        try {
            const { id } = req.params;

            const request = await FundraiserRequest.findByPk(id);
            if (!request) {
                return res.status(404).json({ success: false, message: 'Request not found' });
            }

            await FundraiserRequest.destroy({ where: { id } });

            res.json({ success: true, message: 'Request deleted successfully' });
        } catch (error) {
            console.error('Error deleting request:', error);
            res.status(500).json({ success: false, message: 'Failed to delete request' });
        }
    }

    async getAllFundraisers(req, res) {
        try {
            const { page, limit, offset } = this.getPaginationParams(req);
            const { status, type, search } = req.query;
            
            const where = {};
            if (status) where.fundraiser_status = status;
            if (type) where.fundraiser_type = type;
            if (search) {
                where[Op.or] = [
                    { fundraiser_title: { [Op.iLike]: `%${search}%` } },
                    { fundraiser_user_id: { [Op.eq]: search } }
                ];
            }

            // Use a higher limit for client-side pagination, or allow override
            const actualLimit = parseInt(req.query.limit) || 1000; // Increased from 10

            const { count, rows } = await Fundraiser.findAndCountAll({
                where,
                order: [['created_at', 'DESC']],
                limit: actualLimit,
                offset: req.query.limit ? offset : 0 // Only apply offset if limit explicitly set
            });

            const formatted = rows.map(f => ({
                id: f.fundraiser_id,
                main_image: f.fundraiser_main_image,
                title: f.fundraiser_title,
                collected_amount: parseFloat(f.fundraiser_collected_amount || 0),
                target_amount: parseFloat(f.fundraiser_target_amount || 0),
                status: f.fundraiser_status,
                user_id: f.fundraiser_user_id,
                type: f.fundraiser_type,
                categories: f.fundraiser_categories || [],
                is_urgent: f.is_urgent || false,
                is_blocked: f.is_blocked || false,
                block_reason: f.block_reason || null,
            }));

            res.json({
                success: true,
                data: formatted,
                pagination: this.buildPaginationResponse(page, actualLimit, count)
            });
        } catch (error) {
            console.error('Error fetching fundraisers:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch fundraisers' });
        }
    }

    async getAllVerificationRequests(req, res) {
        try {
            const { page, limit, offset } = this.getPaginationParams(req);
            const { status, fundraiser_type, search } = req.query;
            
            const where = {};
            if (status) where.request_status = status;
            if (fundraiser_type) where.fundraiser_type = fundraiser_type;
            if (search) {
                where[Op.or] = [
                    { user_full_name: { [Op.iLike]: `%${search}%` } },
                    { user_email: { [Op.iLike]: `%${search}%` } },
                    { charity_full_name: { [Op.iLike]: `%${search}%` } }
                ];
            }

            const { count, rows } = await FundraisersVerificationRequest.findAndCountAll({
                where,
                include: [
                    { model: User, as: 'requester', attributes: ['id', 'full_name', 'email'], required: false },
                    { model: Fundraiser, as: 'fundraiser', attributes: ['fundraiser_id', 'fundraiser_title', 'fundraiser_status', 'fundraiser_type'], required: false }
                ],
                order: [['created_at', 'DESC']],
                limit,
                offset
            });

            const formatted = rows.map(r => ({
                request_id: r.request_id,
                user_id: r.user_id,
                user_email: r.user_email,
                user_type: r.user_type,
                fundraiser_id: r.fundraiser_id,
                fundraiser_type: r.fundraiser_type,
                user_full_name: r.user_full_name,
                user_identity_number: r.user_identity_number,
                user_current_address: r.user_current_address,
                charity_full_name: r.charity_full_name,
                charity_license_number: r.charity_license_number,
                charity_current_address: r.charity_current_address,
                request_status: r.request_status,
                created_at: r.created_at,
                fundraiser_title: r.fundraiser ? r.fundraiser.fundraiser_title : null,
                fundraiser_status: r.fundraiser ? r.fundraiser.fundraiser_status : null
            }));

            res.json({
                success: true,
                data: formatted,
                pagination: this.buildPaginationResponse(page, limit, count)
            });
        } catch (error) {
            console.error('Error fetching verification requests:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch verification requests' });
        }
    }

    async acceptVerificationRequest(req, res) {
        const transaction = await Sequelize.transaction();
        try {
            const { id } = req.params;
            
            const request = await FundraisersVerificationRequest.findByPk(id, {
                include: [{ model: Fundraiser, as: 'fundraiser' }],
                transaction
            });
            
            if (!request) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: 'Verification request not found' });
            }
            
            if (request.request_status !== 'pending') {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: 'Request already processed' });
            }
            
            await request.update({ request_status: 'accepted' }, { transaction });
            
            const fundraiser = request.fundraiser;
            if (fundraiser) {
                const newStatus = fundraiser.fundraiser_type === 'Donation' ? 'create_form' : 'incompleted';
                await fundraiser.update({ fundraiser_status: newStatus }, { transaction });
            }
            
            await transaction.commit();
            res.json({ success: true, message: 'Request accepted and campaign status updated' });
        } catch (error) {
            await transaction.rollback();
            console.error('Error accepting verification request:', error);
            res.status(500).json({ success: false, message: 'Failed to accept request' });
        }
    }

    async rejectVerificationRequest(req, res) {
        const transaction = await Sequelize.transaction();
        try {
            const { id } = req.params;
            
            const request = await FundraisersVerificationRequest.findByPk(id, { transaction });
            
            if (!request) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: 'Verification request not found' });
            }
            
            if (request.request_status !== 'pending') {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: 'Request already processed' });
            }
            
            await request.update({ request_status: 'rejected' }, { transaction });
            
            await User.update(
                { is_banned: true, ban_reason: 'Verification request rejected by administrator' },
                { where: { id: request.user_id }, transaction }
            );
            
            await transaction.commit();
            res.json({ success: true, message: 'Request rejected and user banned' });
        } catch (error) {
            await transaction.rollback();
            console.error('Error rejecting verification request:', error);
            res.status(500).json({ success: false, message: 'Failed to reject request' });
        }
    }

    async getSelectedBanners(req, res) {
        try {
            const selectedBanners = await EmergencyReliefBanner.findAll({
                where: { selected_for_home: true },
                order: [['created_at', 'DESC']],
                limit: 4
            });

            // If less than 4 selected, auto-fill with latest non-selected
            if (selectedBanners.length < 4) {
                const remainingCount = 4 - selectedBanners.length;
                const existingIds = selectedBanners.map(b => b.id);
                
                const autoFill = await EmergencyReliefBanner.findAll({
                    where: {
                        id: { [Op.notIn]: existingIds.length > 0 ? existingIds : [0] },
                        selected_for_home: false
                    },
                    order: [['created_at', 'DESC']],
                    limit: remainingCount
                });
                
                selectedBanners.push(...autoFill);
            }

            // Add idText field dynamically based on position (for frontend CSS classes)
            const idTexts = ['three', 'four', 'five', 'six'];
            // When formatting banners for the view, ensure dates are proper strings
            const formattedBanners = selectedBanners.map((banner, index) => {
                const plain = banner.toJSON ? banner.toJSON() : banner;
                const rawDate = plain.date;
                
                // Handle various date formats from PostgreSQL
                let formattedDate = 'N/A';
                if (rawDate) {
                    try {
                        const d = new Date(rawDate);
                        if (!isNaN(d.getTime())) {
                            formattedDate = d.toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                            });
                        } else {
                            // If already a string, try to extract date parts or use as-is
                            formattedDate = String(rawDate).split(',')[0] || String(rawDate);
                        }
                    } catch (e) {
                        formattedDate = String(rawDate).split(',')[0] || 'N/A';
                    }
                }
                
                return {
                    ...plain,
                    idText: idTexts[index] || 'three',
                    date: formattedDate
                };
            });

            res.json({
                success: true,
                data: formattedBanners,
                count: formattedBanners.length,
                isAutoFilled: formattedBanners.filter(b => !b.selected_for_home).length > 0
            });
        } catch (error) {
            console.error('Error fetching selected banners:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch selected banners' });
        }
    }

    async toggleBannerSelection(req, res) {
        try {
            const { id } = req.params;
            const { selected } = req.body; // true or false

            const banner = await EmergencyReliefBanner.findByPk(id);
            if (!banner) {
                return res.status(404).json({ success: false, message: 'Banner not found' });
            }

            // If selecting, check if we already have 4 selected
            if (selected === true) {
                const currentSelected = await EmergencyReliefBanner.count({
                    where: { selected_for_home: true }
                });
                
                if (currentSelected >= 4) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Maximum 4 banners can be selected for home page. Please deselect one first.' 
                    });
                }
            }

            await banner.update({ selected_for_home: selected });

            res.json({
                success: true,
                message: `Banner ${selected ? 'selected' : 'deselected'} successfully`,
                data: { id: banner.id, selected_for_home: selected }
            });
        } catch (error) {
            console.error('Error toggling banner selection:', error);
            res.status(500).json({ success: false, message: 'Failed to update banner selection' });
        }
    }

    async getBannersWithSelection(req, res) {
        try {
            const { page, limit, offset } = this.getPaginationParams(req);
            
            const { count, rows } = await EmergencyReliefBanner.findAndCountAll({
                order: [['created_at', 'DESC']],
                limit,
                offset
            });

            res.json({
                success: true,
                data: rows,
                pagination: this.buildPaginationResponse(page, limit, count)
            });
        } catch (error) {
            console.error('Error fetching banners:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch banners' });
        }
    }

    /* ─── LEDGER TRANSACTIONS ─── */

    async getAllLedgerTransactions(req, res) {
        try {
            const { page, limit, offset } = this.getPaginationParams(req);
            const { type, reference_type, search } = req.query;
            
            const where = {};
            if (type) {
                const types = Array.isArray(type) ? type : [type];
                where.type = { [Op.in]: types };
            }
            if (reference_type) {
                const refTypes = Array.isArray(reference_type) ? reference_type : [reference_type];
                where.reference_type = { [Op.in]: refTypes };
            }
            if (search) {
                where[Op.or] = [
                    { description: { [Op.iLike]: `%${search}%` } },
                    { id: { [Op.eq]: search } },
                    { reference_id: { [Op.eq]: search } }
                ];
            }

            const { count, rows } = await LedgerTransaction.findAndCountAll({
                where,
                order: [['created_at', 'DESC']],
                limit,
                offset
            });

            const formatted = rows.map(lt => ({
                id: lt.id,
                fundraiser_id: lt.fundraiser_id,
                user_id: lt.user_id,
                type: lt.type,
                amount: parseFloat(lt.amount || 0).toFixed(2),
                currency: lt.currency,
                reference_type: lt.reference_type,
                reference_id: lt.reference_id,
                description: lt.description,
                created_at: lt.created_at
            }));

            res.json({
                success: true,
                data: formatted,
                pagination: this.buildPaginationResponse(page, limit, count)
            });
        } catch (error) {
            console.error('Error fetching ledger transactions:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch ledger transactions' });
        }
    }

    /* ─── FUNDRAISER BALANCES ─── */

    async getAllFundraiserBalances(req, res) {
        try {
            const { page, limit, offset } = this.getPaginationParams(req);
            const { min_available, max_available, has_pending, search } = req.query;
            
            const where = {};
            if (min_available !== undefined) {
                where.available_balance = { [Op.gte]: parseFloat(min_available) };
            }
            if (max_available !== undefined) {
                where.available_balance = { 
                    ...(where.available_balance || {}),
                    [Op.lte]: parseFloat(max_available) 
                };
            }
            if (has_pending === 'true') {
                where.pending_withdrawal_balance = { [Op.gt]: 0 };
            } else if (has_pending === 'false') {
                where.pending_withdrawal_balance = { [Op.eq]: 0 };
            }
            if (search) {
                where.fundraiser_id = { [Op.eq]: parseInt(search) || 0 };
            }

            const { count, rows } = await FundraiserBalance.findAndCountAll({
                where,
                order: [['updated_at', 'DESC']],
                limit,
                offset
            });

            const formatted = rows.map(b => ({
                fundraiser_id: b.fundraiser_id,
                total_balance: parseFloat(b.total_balance || 0).toFixed(2),
                available_balance: parseFloat(b.available_balance || 0).toFixed(2),
                pending_withdrawal_balance: parseFloat(b.pending_withdrawal_balance || 0).toFixed(2),
                total_withdrawn: parseFloat(b.total_withdrawn || 0).toFixed(2),
                total_donors: b.total_donors,
                total_fees: parseFloat(b.total_fees || 0).toFixed(2),
                last_donation_at: b.last_donation_at,
                updated_at: b.updated_at
            }));

            res.json({
                success: true,
                data: formatted,
                pagination: this.buildPaginationResponse(page, limit, count)
            });
        } catch (error) {
            console.error('Error fetching fundraiser balances:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch fundraiser balances' });
        }
    }

    /* ─── WITHDRAW REQUESTS ─── */

    async getAllWithdrawRequests(req, res) {
        try {
            const { page, limit, offset } = this.getPaginationParams(req);
            const { status, method, search } = req.query;
            
            const where = {};
            if (status) {
                const statuses = Array.isArray(status) ? status : [status];
                where.status = { [Op.in]: statuses };
            }
            if (method) {
                const methods = Array.isArray(method) ? method : [method];
                where.withdrawal_method = { [Op.in]: methods };
            }
            if (search) {
                where[Op.or] = [
                    { user_id: { [Op.eq]: parseInt(search) || 0 } },
                    { fundraiser_id: { [Op.eq]: parseInt(search) || 0 } }
                ];
            }

            const { count, rows } = await WithdrawRequest.findAndCountAll({
                where,
                include: [
                    { model: User, as: 'user', attributes: ['id', 'full_name', 'email'], required: false },
                    { model: Fundraiser, as: 'fundraiser', attributes: ['fundraiser_id', 'fundraiser_title'], required: false },
                    { model: User, as: 'reviewer', attributes: ['id', 'full_name'], required: false }
                ],
                order: [['created_at', 'DESC']],
                limit,
                offset
            });

            const formatted = rows.map(wr => ({
                id: wr.id,
                fundraiser_id: wr.fundraiser_id,
                user_id: wr.user_id,
                user_name: wr.user ? wr.user.full_name : null,
                user_email: wr.user ? wr.user.email : null,
                amount: parseFloat(wr.amount || 0).toFixed(2),
                withdrawal_method: wr.withdrawal_method,
                withdrawal_details: wr.withdrawal_details,
                notes: wr.notes,
                admin_notes: wr.admin_notes,
                status: wr.status,
                reviewed_by: wr.reviewed_by,
                reviewer_name: wr.reviewer ? wr.reviewer.full_name : null,
                reviewed_at: wr.reviewed_at,
                created_at: wr.created_at,
                updated_at: wr.updated_at,
                // Include transfer log status for button logic
                transfer_log: null // Will be populated separately if needed
            }));

            res.json({
                success: true,
                data: formatted,
                pagination: this.buildPaginationResponse(page, limit, count)
            });
        } catch (error) {
            console.error('Error fetching withdraw requests:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch withdraw requests' });
        }
    }

    async approveWithdrawRequest(req, res) {
        const transaction = await Sequelize.transaction();
        try {
            const { id } = req.params;
            const adminUserId = req.user.id;

            const withdrawRequest = await WithdrawRequest.findByPk(id, {
                include: [{ model: Fundraiser, as: 'fundraiser' }],
                transaction
            });
            
            if (!withdrawRequest) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: 'Withdraw request not found' });
            }
            
            if (withdrawRequest.status !== 'pending') {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: 'Request already processed' });
            }

            // FIX: Do NOT reserve funds here - they were already reserved when user created the request
            // Just verify that pending balance matches the request amount
            const balance = await FundraiserBalance.findByPk(withdrawRequest.fundraiser_id, { transaction });
            if (!balance) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: 'Fundraiser balance not found' });
            }

            // Verify funds are properly tracked (pending should cover the request)
            const pendingBalance = parseFloat(balance.pending_withdrawal_balance) || 0;
            const requestAmount = parseFloat(withdrawRequest.amount);
            
            if (pendingBalance < requestAmount) {
                // Funds weren't properly reserved - auto-reserve now if available
                const availableBalance = parseFloat(balance.available_balance) || 0;
                if (availableBalance >= requestAmount) {
                    const reserveResult = await balance.reserveForWithdrawal(requestAmount);
                    if (!reserveResult.success) {
                        await transaction.rollback();
                        return res.status(400).json({ success: false, message: reserveResult.error });
                    }
                } else {
                    await transaction.rollback();
                    return res.status(400).json({ 
                        success: false, 
                        message: `Insufficient available balance. Requested: ${requestAmount}, Available: ${availableBalance}, Pending: ${pendingBalance}` 
                    });
                }
            }

            // Approve the request
            await withdrawRequest.approve(adminUserId, 'Approved by admin');
            
            // Create ledger entry
            await LedgerTransaction.createWithdrawalEntry({
                fundraiser_id: withdrawRequest.fundraiser_id,
                user_id: withdrawRequest.user_id,
                amount: withdrawRequest.amount,
                reference_id: withdrawRequest.id
            }, { transaction });

            await transaction.commit();
            res.json({ success: true, message: 'Withdraw request approved and funds reserved' });
        } catch (error) {
            await transaction.rollback();
            console.error('Error approving withdraw request:', error);
            res.status(500).json({ success: false, message: 'Failed to approve withdraw request' });
        }
    }

    async rejectWithdrawRequest(req, res) {
        const transaction = await Sequelize.transaction();
        try {
            const { id } = req.params;
            const { reason } = req.body || {};
            const adminUserId = req.user.id;

            const withdrawRequest = await WithdrawRequest.findByPk(id, { transaction });
            
            if (!withdrawRequest) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: 'Withdraw request not found' });
            }
            
            if (withdrawRequest.status !== 'pending') {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: 'Request already processed' });
            }

            await withdrawRequest.reject(adminUserId, reason || 'Rejected by admin');
            
            await transaction.commit();
            res.json({ success: true, message: 'Withdraw request rejected' });
        } catch (error) {
            await transaction.rollback();
            console.error('Error rejecting withdraw request:', error);
            res.status(500).json({ success: false, message: 'Failed to reject withdraw request' });
        }
    }

    async executeTransfer(req, res) {
        const transaction = await Sequelize.transaction();
        try {
            const { id } = req.params; // withdraw request id
            const { platform_info, note, transfer_method } = req.body || {};

            const withdrawRequest = await WithdrawRequest.findByPk(id, {
                include: [
                    { model: Fundraiser, as: 'fundraiser' }
                    // REMOVED: { model: FundraiserBalance, as: 'fundraiserBalance', required: false }
                ],
                transaction
            });
            
            if (!withdrawRequest) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: 'Withdraw request not found' });
            }
            
            if (withdrawRequest.status !== 'approved') {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: 'Request must be approved first' });
            }

            // Check if transfer log already exists
            const existingTransfer = await TransferLog.findOne({
                where: { withdraw_request_id: id },
                transaction
            });
            
            if (existingTransfer) {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: 'Transfer already initiated' });
            }

            // Calculate fee and net
            const fee = TransferLog.calculateFee(withdrawRequest.amount, 3);
            const netAmount = parseFloat((parseFloat(withdrawRequest.amount) - fee).toFixed(2));

            // Determine which method to use for the actual transfer
            // Admin can choose different from withdrawal request method
            const actualTransferMethod = transfer_method || withdrawRequest.withdrawal_method;

            // For Stripe: Create actual transfer to connected account
            let providerTransferId = null;
            let stripeTransferResult = null;
            
            if (actualTransferMethod === 'stripe' && platform_info && platform_info.stripe_account_id) {
                try {
                    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
                    
                    // Create a Transfer from platform to connected account
                    stripeTransferResult = await stripe.transfers.create({
                        amount: Math.round(netAmount * 100), // Convert to cents
                        currency: 'usd',
                        destination: platform_info.stripe_account_id,
                        description: `Withdrawal #${withdrawRequest.id} for fundraiser #${withdrawRequest.fundraiser_id}`,
                        metadata: {
                            withdraw_request_id: String(withdrawRequest.id),
                            fundraiser_id: String(withdrawRequest.fundraiser_id),
                            user_id: String(withdrawRequest.user_id),
                            net_amount: String(netAmount),
                            fee: String(fee)
                        }
                    });
                    
                    providerTransferId = stripeTransferResult.id;
                } catch (stripeError) {
                    console.error('Stripe transfer error:', stripeError);
                    await transaction.rollback();
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Stripe transfer failed: ' + stripeError.message,
                        stripe_error: stripeError.type
                    });
                }
            }

            // Create transfer log
            const transferLog = await TransferLog.create({
                withdraw_request_id: id,
                fundraiser_id: withdrawRequest.fundraiser_id,
                user_id: withdrawRequest.user_id,
                amount: withdrawRequest.amount,
                fee: fee,
                net_amount: netAmount,
                transfer_provider: this.mapWithdrawalMethodToProvider(actualTransferMethod),
                provider_transfer_id: providerTransferId,
                withdrawal_type: withdrawRequest.withdrawal_type || 'final', // ✅ ADD THIS
                status: 'processing'
            }, { transaction });

            // Mark request as processing
            await withdrawRequest.markAsProcessing();

            // Add admin note if provided
            if (note) {
                await withdrawRequest.update({
                    admin_notes: (withdrawRequest.admin_notes || '') + '\n[Transfer Initiated] ' + note
                }, { transaction });
            }

            await transaction.commit();
            res.json({ 
                success: true, 
                message: 'Transfer initiated successfully',
                data: { 
                    transfer_id: transferLog.id,
                    stripe_transfer: stripeTransferResult ? {
                        id: stripeTransferResult.id,
                        amount: stripeTransferResult.amount,
                        destination: stripeTransferResult.destination
                    } : null
                }
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error executing transfer:', error);
            res.status(500).json({ success: false, message: 'Failed to execute transfer' });
        }
    }

    async retryTransfer(req, res) {
        const transaction = await Sequelize.transaction();
        try {
            const { id } = req.params; // withdraw request id

            const transferLog = await TransferLog.findOne({
                where: { withdraw_request_id: id },
                transaction
            });
            
            if (!transferLog) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: 'Transfer log not found' });
            }
            
            if (transferLog.status !== 'failed') {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: 'Only failed transfers can be retried' });
            }

            // Reset to processing
            transferLog.status = 'processing';
            transferLog.transferred_at = null;
            await transferLog.save({ transaction });

            await transaction.commit();
            res.json({ success: true, message: 'Transfer retry initiated' });
        } catch (error) {
            await transaction.rollback();
            console.error('Error retrying transfer:', error);
            res.status(500).json({ success: false, message: 'Failed to retry transfer' });
        }
    }

    async completeTransfer(req, res) {
        const transaction = await Sequelize.transaction();
        try {
            const { id } = req.params; // withdraw request id
            const { provider_transfer_id } = req.body || {};

            const transferLog = await TransferLog.findOne({
                where: { withdraw_request_id: id },
                include: [{ model: WithdrawRequest, as: 'withdraw_request' }],
                transaction
            });
            
            if (!transferLog) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: 'Transfer log not found' });
            }
            
            if (transferLog.status !== 'processing') {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: 'Transfer must be in processing state' });
            }

            const withdrawRequest = transferLog.withdraw_request;
            
            // For Stripe: Verify the transfer succeeded
            let stripeVerified = false;
            if (transferLog.transfer_provider === 'stripe' && transferLog.provider_transfer_id) {
                try {
                    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
                    const stripeTransfer = await stripe.transfers.retrieve(transferLog.provider_transfer_id);
                    if (stripeTransfer && stripeTransfer.reversed === false) {
                        stripeVerified = true;
                    }
                } catch (stripeError) {
                    console.warn('Could not verify Stripe transfer:', stripeError.message);
                    // Continue anyway - admin is manually confirming
                }
            }

            // Complete the transfer
            await transferLog.markAsCompleted(provider_transfer_id || transferLog.provider_transfer_id || null);
            
            // Complete withdrawal in balance
            const balance = await FundraiserBalance.findByPk(transferLog.fundraiser_id, { transaction });
            if (balance) {
                await balance.completeWithdrawal(transferLog.amount, transferLog.fee);
            }
            
            // Mark request as completed
            await withdrawRequest.markAsCompleted();

            // Record fee in ledger
            await LedgerTransaction.createFeeEntry({
                fundraiser_id: transferLog.fundraiser_id,
                user_id: transferLog.user_id,
                amount: transferLog.fee,
                currency: 'USD',
                reference_id: transferLog.id,
                reference_type: 'transfer_log',
                description: `Platform fee of $${transferLog.fee} (3%) for transfer #${transferLog.id}`
            }, { transaction });

            await transaction.commit();
            res.json({ 
                success: true, 
                message: 'Transfer completed successfully',
                data: {
                    transfer_id: transferLog.id,
                    stripe_verified: stripeVerified
                }
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error completing transfer:', error);
            res.status(500).json({ success: false, message: 'Failed to complete transfer' });
        }
    }

    mapWithdrawalMethodToProvider(method) {
        const map = {
            'stripe': 'stripe',
            'bank_transfer': 'bank',
            'paypal': 'paypal',
            'palpay': 'palpay'
        };
        return map[method] || 'bank';
    }

    /* ─── TRANSFER LOGS ─── */

    async getAllTransferLogs(req, res) {
        try {
            const { page, limit, offset } = this.getPaginationParams(req);
            const { status, provider, search } = req.query;
            
            const where = {};
            if (status) {
                const statuses = Array.isArray(status) ? status : [status];
                where.status = { [Op.in]: statuses };
            }
            if (provider) {
                const providers = Array.isArray(provider) ? provider : [provider];
                where.transfer_provider = { [Op.in]: providers };
            }
            if (search) {
                where[Op.or] = [
                    { provider_transfer_id: { [Op.iLike]: `%${search}%` } },
                    { fundraiser_id: { [Op.eq]: parseInt(search) || 0 } }
                ];
            }

            const { count, rows } = await TransferLog.findAndCountAll({
                where,
                include: [
                    { model: WithdrawRequest, as: 'withdraw_request', required: false },
                    { model: Fundraiser, as: 'fundraiser', attributes: ['fundraiser_id', 'fundraiser_title'], required: false },
                    { model: User, as: 'user', attributes: ['id', 'full_name'], required: false }
                ],
                order: [['created_at', 'DESC']],
                limit,
                offset
            });

            const formatted = rows.map(tl => ({
                id: tl.id,
                withdraw_request_id: tl.withdraw_request_id,
                fundraiser_id: tl.fundraiser_id,
                user_id: tl.user_id,
                user_name: tl.user ? tl.user.full_name : null,
                amount: parseFloat(tl.amount || 0).toFixed(2),
                fee: parseFloat(tl.fee || 0).toFixed(2),
                net_amount: parseFloat(tl.net_amount || 0).toFixed(2),
                transfer_provider: tl.transfer_provider,
                provider_transfer_id: tl.provider_transfer_id,
                status: tl.status,
                transferred_at: tl.transferred_at,
                created_at: tl.created_at
            }));

            res.json({
                success: true,
                data: formatted,
                pagination: this.buildPaginationResponse(page, limit, count)
            });
        } catch (error) {
            console.error('Error fetching transfer logs:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch transfer logs' });
        }
    }
}

module.exports = new AdminPanelController();