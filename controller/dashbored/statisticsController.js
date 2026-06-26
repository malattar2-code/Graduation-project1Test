// controllers/statisticsController.js
const { Op } = require('sequelize');
const User = require('../../models/User');
const Fundraiser = require('../../models/Fundraiser');

class StatisticsController {
    constructor() {
        // Bind methods to maintain 'this' context
        this.generateMonthsArray = this.generateMonthsArray.bind(this);
        this.getUserCountsByMonth = this.getUserCountsByMonth.bind(this);
        this.formatChartData = this.formatChartData.bind(this);
        this.getMonthlyUserStatisticsData = this.getMonthlyUserStatisticsData.bind(this);
        this.getUserStatistics = this.getUserStatistics.bind(this);
        this.getMonthlyUserStatistics = this.getMonthlyUserStatistics.bind(this);
        // Add fundraiser statistics method bindings
        this.getFundraiserCountsByMonth = this.getFundraiserCountsByMonth.bind(this);
        this.formatFundraiserChartData = this.formatFundraiserChartData.bind(this);
        this.getMonthlyFundraiserStatisticsData = this.getMonthlyFundraiserStatisticsData.bind(this);
        this.getMonthlyFundraiserStatistics = this.getMonthlyFundraiserStatistics.bind(this);
        this.getFundraiserStatistics = this.getFundraiserStatistics.bind(this); // ← ADD THIS

        // Add rank statistics method bindings
        this.calculateRankStatistics = this.calculateRankStatistics.bind(this);
        this.getRankStatisticsData = this.getRankStatisticsData.bind(this);
        this.getRankStatistics = this.getRankStatistics.bind(this);
        
        //Add formsRequests statistics method bindings
        this.getMonthlyFormsRequestsStatistics = this.getMonthlyFormsRequestsStatistics.bind(this);
        this.getFormsRequestsCountsByMonth = this.getFormsRequestsCountsByMonth.bind(this);
        this.formatFormsRequestsChartData = this.formatFormsRequestsChartData.bind(this);
        this.getMonthlyFormsRequestsStatisticsData = this.getMonthlyFormsRequestsStatisticsData.bind(this);
        this.getFormsRequestsStatistics = this.getFormsRequestsStatistics.bind(this);
    }
    
    /**
     * Get monthly user statistics for the chart
     */
    async getMonthlyUserStatistics(req, res) {
        try {
            console.log('📊 Fetching monthly user statistics...');
            
            // Define the date range: August 2025 to August 2026
            const startDate = new Date('2025-08-01');
            const endDate = new Date('2026-08-31');
            
            // Generate all months in the range
            const months = this.generateMonthsArray(startDate, endDate);
            
            // Get user counts by month and user_type
            const monthlyStats = await this.getUserCountsByMonth(months);
            
            // Format the data for the chart
            const chartData = this.formatChartData(months, monthlyStats);
            
            console.log('✅ Monthly user statistics fetched successfully');
            
            res.json({
                success: true,
                data: chartData,
                timeframe: {
                    start: 'August 2025',
                    end: 'August 2026'
                }
            });
            
        } catch (error) {
            console.error('❌ Error fetching monthly user statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching user statistics',
                error: error.message
            });
        }
    }

    /**
     * Generate array of months between two dates
     */
    generateMonthsArray(startDate, endDate) {
        const months = [];
        const current = new Date(startDate);
        
        while (current <= endDate) {
            months.push({
                year: current.getFullYear(),
                month: current.getMonth() + 1, // 1-12
                label: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            });
            current.setMonth(current.getMonth() + 1);
        }
        
        return months;
    }

    /**
     * Get user counts grouped by month and user_type
     */
    async getUserCountsByMonth(months) {
        const stats = [];
        
        for (const month of months) {
            const monthStart = new Date(month.year, month.month - 1, 1);
            const monthEnd = new Date(month.year, month.month, 0, 23, 59, 59);
            
            try {
                // Get donor counts (users with user_type = 'donor' or similar)
                const donorCount = await User.count({
                    where: {
                        created_at: {
                            [Op.between]: [monthStart, monthEnd]
                        },
                        user_type: {
                            [Op.iLike]: '%donor%' // Case-insensitive match
                        }
                    }
                });

                // Get requester counts (users with user_type = 'requester', 'needer', etc.)
                const requesterCount = await User.count({
                    where: {
                        created_at: {
                            [Op.between]: [monthStart, monthEnd]
                        },
                        user_type: {
                            [Op.iLike]: '%requester%' // Case-insensitive match
                        }
                    }
                });
                // Get charity counts
                const charityCount = await User.count({
                    where: {
                        created_at: {
                            [Op.between]: [monthStart, monthEnd]
                        },
                        user_type: 'Charity'
                    }
                });
                // Alternative: If user_type is not reliable, use fundraiser association
                // This counts users who created fundraisers as "requesters"
                const fundraiserRequesterCount = await User.count({
                    include: [{
                        model: Fundraiser,
                        as: 'fundraisers',
                        required: true,
                        where: {
                            created_at: {
                                [Op.between]: [monthStart, monthEnd]
                            }
                        }
                    }]
                });

                // Use the actual counts or fallback to fundraiser-based counting
                const finalRequesterCount = requesterCount > 0 ? requesterCount : fundraiserRequesterCount;
                
                stats.push({
                    year: month.year,
                    month: month.month,
                    label: month.label,
                    donors: donorCount,
                    requesters: finalRequesterCount,
                    charities: charityCount
                });

            } catch (error) {
                console.error(`❌ Error counting users for ${month.label}:`, error);
                // Push zero counts for this month if there's an error
                stats.push({
                    year: month.year,
                    month: month.month,
                    label: month.label,
                    donors: 0,
                    requesters: 0,
                    charities: 0
                });
            }
        }
        
        return stats;
    }

    /**
     * Format data for the chart
     */
    formatChartData(months, monthlyStats) {
        return months.map(month => {
            const stat = monthlyStats.find(s => 
                s.year === month.year && s.month === month.month
            ) || { donors: 0, requesters: 0, charities: 0 };
            
            return {
                month: month.label,
                donors: stat.donors,
                requesters: stat.requesters,
                charities: stat.charities
            };
        });
    }

    /**
     * Get additional user statistics
     */
    async getUserStatistics(req, res) {
        try {
            console.log('📊 Fetching comprehensive user statistics...');
            
            // Total counts
            const totalUsers = await User.count();
            const totalDonors = await User.count({
                where: { user_type: { [Op.iLike]: '%donor%' } }
            });
            const totalRequesters = await User.count({
                where: { user_type: { [Op.iLike]: '%requester%' } }
            });
            const totalCharities = await User.count({
                where: { user_type: 'Charity' }
            });
            // Monthly growth
            const currentMonth = new Date();
            const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
            const monthBeforeLast = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 2, 1);

            const currentMonthCount = await User.count({
                where: {
                    created_at: {
                        [Op.between]: [
                            new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
                            new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
                        ]
                    }
                }
            });

            const lastMonthCount = await User.count({
                where: {
                    created_at: {
                        [Op.between]: [
                            new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
                            new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)
                        ]
                    }
                }
            });

            const growthRate = lastMonthCount > 0 ? 
                ((currentMonthCount - lastMonthCount) / lastMonthCount * 100).toFixed(1) : 0;

            // Get chart data - use the bound method
            const chartData = await this.getMonthlyUserStatisticsData();

            res.json({
                success: true,
                data: {
                    totals: {
                        users: totalUsers,
                        donors: totalDonors,
                        requesters: totalRequesters,
                        charities: totalCharities
                    },
                    percentages: {
                        donors: totalUsers > 0 ? Math.round((totalDonors / totalUsers) * 100) : 0,
                        requesters: totalUsers > 0 ? Math.round((totalRequesters / totalUsers) * 100) : 0,
                        charities: totalUsers > 0 ? Math.round((totalCharities / totalUsers) * 100) : 0
                    },
                    monthly: {
                        current: currentMonthCount,
                        previous: lastMonthCount,
                        growthRate: growthRate
                    },
                    chartData: chartData
                }
            });

        } catch (error) {
            console.error('❌ Error fetching user statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching user statistics',
                error: error.message
            });
        }
    }

    /**
     * Helper method to get just the chart data
     */
    async getMonthlyUserStatisticsData() {
        const startDate = new Date('2025-08-01');
        const endDate = new Date('2026-08-31');
        const months = this.generateMonthsArray(startDate, endDate);
        const monthlyStats = await this.getUserCountsByMonth(months);
        return this.formatChartData(months, monthlyStats);
    }

    /**
     * Debug middleware to check route accessibility
     */
    async debugRoute(req, res, next) {
        console.log('🔍 Statistics Route Debug:');
        console.log('🔍 Method:', req.method);
        console.log('🔍 URL:', req.originalUrl);
        console.log('🔍 Headers:', req.headers);
        console.log('🔍 User:', req.user ? 'Authenticated' : 'Not authenticated');
        next();
    }
    /**
     * Get monthly fundraiser statistics for the chart
     */
    async getMonthlyFundraiserStatistics(req, res) {
        try {
            console.log('📊 Fetching monthly fundraiser statistics...');
            
            // Define the date range: August 2025 to August 2026
            const startDate = new Date('2025-08-01');
            const endDate = new Date('2026-08-31');
            
            // Generate all months in the range
            const months = this.generateMonthsArray(startDate, endDate);
            
            // Get fundraiser counts by month and status
            const monthlyStats = await this.getFundraiserCountsByMonth(months);
            
            // Format the data for the chart
            const chartData = this.formatFundraiserChartData(months, monthlyStats);
            
            console.log('✅ Monthly fundraiser statistics fetched successfully');
            
            res.json({
                success: true,
                data: chartData,
                timeframe: {
                    start: 'August 2025',
                    end: 'August 2026'
                }
            });
            
        } catch (error) {
            console.error('❌ Error fetching monthly fundraiser statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching fundraiser statistics',
                error: error.message
            });
        }
    }

    /**
     * Get fundraiser counts grouped by month and status
     */
    async getFundraiserCountsByMonth(months) {
        const stats = [];
        
        for (const month of months) {
            const monthStart = new Date(month.year, month.month - 1, 1);
            const monthEnd = new Date(month.year, month.month, 0, 23, 59, 59);
            
            try {
                // Get completed fundraiser counts
                const completedCount = await Fundraiser.count({
                    where: {
                        created_at: {
                            [Op.between]: [monthStart, monthEnd]
                        },
                        fundraiser_status: 'completed'
                    }
                });

                // Get incompleted fundraiser counts
                const incompletedCount = await Fundraiser.count({
                    where: {
                        created_at: {
                            [Op.between]: [monthStart, monthEnd]
                        },
                        fundraiser_status: 'incompleted'
                    }
                });
                // Get waiting_requesters fundraiser counts
                const waitingRequestersCount = await Fundraiser.count({
                    where: {
                        created_at: {
                            [Op.between]: [monthStart, monthEnd]
                        },
                        fundraiser_status: 'Waiting_requesters'
                    }
                });

                // Get create_form fundraiser counts
                const createFormCount = await Fundraiser.count({
                    where: {
                        created_at: {
                            [Op.between]: [monthStart, monthEnd]
                        },
                        fundraiser_status: 'create_form'
                    }
                });

                // Get transferred fundraiser counts
                const transferredCount = await Fundraiser.count({
                    where: {
                        created_at: {
                            [Op.between]: [monthStart, monthEnd]
                        },
                        fundraiser_status: 'transferred'
                    }
                });
                stats.push({
                    year: month.year,
                    month: month.month,
                    label: month.label,
                    completed: completedCount,
                    incompleted: incompletedCount,
                    waitingRequesters: waitingRequestersCount,
                    createForm: createFormCount,
                    transferred: transferredCount
                });

            } catch (error) {
                console.error(`❌ Error counting fundraisers for ${month.label}:`, error);
                // Push zero counts for this month if there's an error
                stats.push({
                    year: month.year,
                    month: month.month,
                    label: month.label,
                    completed: 0,
                    incompleted: 0,
                    waitingRequesters: 0,   // ← ADD
                    createForm: 0,          // ← ADD
                    transferred: 0        // ← ADD
                });
            }
        }
        
        return stats;
    }

    /**
     * Format fundraiser data for the chart
     */
    formatFundraiserChartData(months, monthlyStats) {
        return months.map(month => {
            const stat = monthlyStats.find(s => 
                s.year === month.year && s.month === month.month
            ) || { completed: 0, incompleted: 0, waitingRequesters: 0, createForm: 0, transferred: 0 };
            
            return {
                month: month.label,
                completed: stat.completed,
                incompleted: stat.incompleted,
                waitingRequesters: stat.waitingRequesters,
                createForm: stat.createForm,
                transferred: stat.transferred
            };
        });
    }

    /**
     * Helper method to get just the fundraiser chart data
     */
    async getMonthlyFundraiserStatisticsData() {
        const startDate = new Date('2025-08-01');
        const endDate = new Date('2026-08-31');
        const months = this.generateMonthsArray(startDate, endDate);
        const monthlyStats = await this.getFundraiserCountsByMonth(months);
        return this.formatFundraiserChartData(months, monthlyStats);
    }

    /**
     * Get comprehensive fundraiser statistics
     */
    async getFundraiserStatistics(req, res) {
        try {
            console.log('📊 Fetching comprehensive fundraiser statistics...');
            
            // Total counts
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
            // Monthly growth
            const currentMonth = new Date();
            const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);

            const currentMonthCount = await Fundraiser.count({
                where: {
                    created_at: {
                        [Op.between]: [
                            new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
                            new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
                        ]
                    }
                }
            });

            const lastMonthCount = await Fundraiser.count({
                where: {
                    created_at: {
                        [Op.between]: [
                            new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
                            new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)
                        ]
                    }
                }
            });

            const growthRate = lastMonthCount > 0 ? 
                ((currentMonthCount - lastMonthCount) / lastMonthCount * 100).toFixed(1) : 0;

            // Get chart data
            const chartData = await this.getMonthlyFundraiserStatisticsData();

            res.json({
                success: true,
                data: {
                    totals: {
                        fundraisers: totalFundraisers,
                        completed: completedFundraisers,
                        incompleted: incompletedFundraisers,
                        waitingRequesters: waitingRequestersFundraisers,
                        createForm: createFormFundraisers,
                        transferred: transferredFundraisers
                    },
                    percentages: {
                        completed: totalFundraisers > 0 ? Math.round((completedFundraisers / totalFundraisers) * 100) : 0,
                        incompleted: totalFundraisers > 0 ? Math.round((incompletedFundraisers / totalFundraisers) * 100) : 0,
                        waitingRequesters: totalFundraisers > 0 ? Math.round((waitingRequestersFundraisers / totalFundraisers) * 100) : 0,
                        createForm: totalFundraisers > 0 ? Math.round((createFormFundraisers / totalFundraisers) * 100) : 0,
                        transferred: totalFundraisers > 0 ? Math.round((transferredFundraisers / totalFundraisers) * 100) : 0
                    },
                    monthly: {
                        current: currentMonthCount,
                        previous: lastMonthCount,
                        growthRate: growthRate
                    },
                    chartData: chartData
                }
            });

        } catch (error) {
            console.error('❌ Error fetching fundraiser statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching fundraiser statistics',
                error: error.message
            });
        }
    }
    /**
     * Get comprehensive rank statistics
     */
    async getRankStatistics(req, res) {
        try {
            console.log('📊 Fetching comprehensive rank statistics...');
            
            const rankStats = await this.getRankStatisticsData();
            
            res.json({
                success: true,
                data: rankStats
            });

        } catch (error) {
            console.error('❌ Error fetching rank statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching rank statistics',
                error: error.message
            });
        }
    }

    /**
     * Helper method to get rank statistics data
     */
    async getRankStatisticsData() {
        try {
            const Rank = require('../../models/Rank');
            
            // Fetch all ranks
            const allRanks = await Rank.findAll({
                order: [['minimum_points', 'ASC']]
            });

            return this.calculateRankStatistics(allRanks);
        } catch (error) {
            console.error('❌ Error getting rank statistics data:', error);
            return {
                userRanks: [],
                totalUsersInRanks: 0,
                totalUsersInNoRank: 0,
                totalAllUsers: 0,
                inRankPercentage: 0,
                noRankPercentage: 0,
                noRankName: 'No Rank'
            };
        }
    }

    /**
     * Calculate rank statistics from rank data
     */
    calculateRankStatistics(allRanks) {
        try {
            // Define possible names for "No Rank" to handle different naming conventions
            const noRankNames = ['no rank', 'norank', 'unranked', 'default', 'beginner'];
            
            // Separate "No Rank" from other ranks
            const noRank = allRanks.find(rank => 
                noRankNames.includes(rank.rankName.toLowerCase().trim())
            );
            
            const userRanks = allRanks
                .filter(rank => !noRankNames.includes(rank.rankName.toLowerCase().trim()))
                .map(rank => ({
                    rank: rank.rankName,
                    count: rank.numOfUsersInRank,
                    color: this.generateRankColor(rank.rankName)
                }));

            const totalUsersInRanks = userRanks.reduce((sum, rank) => sum + rank.count, 0);
            const totalUsersInNoRank = noRank ? noRank.numOfUsersInRank : 0;
            const totalAllUsers = totalUsersInRanks + totalUsersInNoRank;

            // Calculate percentages with precision
            const inRankPercentage = totalAllUsers > 0 ? 
                Number(((totalUsersInRanks / totalAllUsers) * 100).toFixed(1)) : 0;
            const noRankPercentage = totalAllUsers > 0 ? 
                Number(((totalUsersInNoRank / totalAllUsers) * 100).toFixed(1)) : 0;

            console.log('📊 Rank Statistics Calculated:', {
                totalRanks: userRanks.length,
                noRankFound: !!noRank,
                totalUsersInRanks,
                totalUsersInNoRank,
                totalAllUsers,
                inRankPercentage,
                noRankPercentage
            });

            return {
                userRanks,
                totalUsersInRanks,
                totalUsersInNoRank,
                totalAllUsers,
                inRankPercentage,
                noRankPercentage,
                noRankName: noRank ? noRank.rankName : 'No Rank'
            };
        } catch (error) {
            console.error('❌ Error calculating rank statistics:', error);
            return {
                userRanks: [],
                totalUsersInRanks: 0,
                totalUsersInNoRank: 0,
                totalAllUsers: 0,
                inRankPercentage: 0,
                noRankPercentage: 0,
                noRankName: 'No Rank'
            };
        }
    }

    /**
     * Helper method to generate consistent colors for ranks
     */
    generateRankColor(rankName) {
        const colors = [
            '#a200ff', '#172aff', '#17f3ff', '#51ff17', '#ff9100', '#eeff00',
            '#ff0062', '#00ffaa', '#b517ff', '#17ffd0', '#ff1744', '#44ff17',
            '#8a2be2', '#00ced1', '#32cd32', '#ff4500', '#daa520', '#ff69b4'
        ];
        
        let hash = 0;
        for (let i = 0; i < rankName.length; i++) {
            hash = rankName.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        return colors[Math.abs(hash) % colors.length];
    }

        // ── Forms & Requests Statistics ──
    async getMonthlyFormsRequestsStatistics(req, res) {
        try {
            const startDate = new Date('2025-08-01');
            const endDate = new Date('2026-08-31');
            const months = this.generateMonthsArray(startDate, endDate);
            const monthlyStats = await this.getFormsRequestsCountsByMonth(months);
            const chartData = this.formatFormsRequestsChartData(months, monthlyStats);
            res.json({ success: true, data: chartData });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error fetching forms/requests statistics', error: error.message });
        }
    }

    async getFormsRequestsCountsByMonth(months) {
        const stats = [];
        const FundraiserForm = require('../../models/FundraiserForm');
        const FundraiserRequest = require('../../models/FundraiserRequest');

        for (const month of months) {
            const monthStart = new Date(month.year, month.month - 1, 1);
            const monthEnd = new Date(month.year, month.month, 0, 23, 59, 59);

            const formsCount = await FundraiserForm.count({
                where: { created_at: { [Op.between]: [monthStart, monthEnd] } }
            });
            const requestsCount = await FundraiserRequest.count({
                where: { created_at: { [Op.between]: [monthStart, monthEnd] } }
            });

            stats.push({ year: month.year, month: month.month, label: month.label, forms: formsCount, requests: requestsCount });
        }
        return stats;
    }

    formatFormsRequestsChartData(months, monthlyStats) {
        return months.map(month => {
            const stat = monthlyStats.find(s => s.year === month.year && s.month === month.month) || { forms: 0, requests: 0 };
            return { month: month.label, forms: stat.forms, requests: stat.requests };
        });
    }

    async getMonthlyFormsRequestsStatisticsData() {
        const startDate = new Date('2025-08-01');
        const endDate = new Date('2026-08-31');
        const months = this.generateMonthsArray(startDate, endDate);
        const monthlyStats = await this.getFormsRequestsCountsByMonth(months);
        return this.formatFormsRequestsChartData(months, monthlyStats);
    }

    async getFormsRequestsStatistics(req, res) {
        try {
            const FundraiserForm = require('../../models/FundraiserForm');
            const FundraiserRequest = require('../../models/FundraiserRequest');

            const totalForms = await FundraiserForm.count();
            const totalRequests = await FundraiserRequest.count();
            const total = totalForms + totalRequests;

            res.json({
                success: true,
                data: {
                    totals: { forms: totalForms, requests: totalRequests, total },
                    percentages: {
                        forms: total > 0 ? Math.round((totalForms / total) * 100) : 0,
                        requests: total > 0 ? Math.round((totalRequests / total) * 100) : 0
                    }
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error fetching forms/requests stats' });
        }
    }
}

module.exports = new StatisticsController();