const Category = require('../../models/Category');
const Fundraiser = require('../../models/Fundraiser');
const User = require('../../models/User');
const { Sequelize } = require('sequelize');
const FundraiserForm = require('../../models/FundraiserForm');
const FundraiserRequest = require('../../models/FundraiserRequest');
const { getLocationFromCoordinates } = require('../../utils/geolocation');

exports.getCategoryById = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const offset = (page - 1) * limit;

        console.log('Fetching category with ID:', categoryId);

        const category = await Category.findByPk(categoryId);
        
        if (!category) {
            console.log('Category not found for ID:', categoryId);
            return res.redirect('/categories?error=Category not found');
        }

        console.log('Category found:', category.category_name);

        let fundraisers = [];
        let count = 0;
        let hasMore = false;

        try {
            // Use array_to_string for PostgreSQL array comparison (same as allFundraisersController)
            const categoryPattern = `%${category.category_name}%`;

            const result = await Fundraiser.findAndCountAll({
                where: {
                    [Sequelize.Op.and]: [
                        {
                            [Sequelize.Op.or]: [
                                Sequelize.where(
                                    Sequelize.fn('array_to_string', Sequelize.col('fundraiser_categories'), ','),
                                    { [Sequelize.Op.iLike]: categoryPattern }
                                ),
                                Sequelize.where(
                                    Sequelize.fn('array_to_string', Sequelize.col('fundraiser_hashtags'), ','),
                                    { [Sequelize.Op.iLike]: categoryPattern }
                                )
                            ]
                        },
                        {
                            fundraiser_status: {
                                [Sequelize.Op.in]: ['incompleted', 'Waiting_requesters', 'create_form']
                            }
                        },
                        { is_blocked: false }
                    ]
                },
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'full_name', 'email', 'location', 'user_image', 'user_type']
                },
                {
                    model: FundraiserForm,
                    as: 'form',
                    required: false
                }],
                limit: limit,
                offset: offset,
                order: [['created_at', 'DESC']]
            });

            count = result.count;
            fundraisers = result.rows;
            const totalPages = Math.ceil(count / limit);
            hasMore = page < totalPages;

            console.log(`Found ${count} fundraisers for category ${category.category_name}`);

            // Get current user for charity form submission check
            const userId = req.user ? req.user.id : null;
            const charityFormIds = fundraisers
                .filter(f => f.fundraiser_status === 'Waiting_requesters' && f.form)
                .map(f => f.form.id);

            let userSubmittedMap = {};
            if (userId && charityFormIds.length > 0) {
                const existingRequests = await FundraiserRequest.findAll({
                    where: {
                        form_id: { [Sequelize.Op.in]: charityFormIds },
                        user_id: userId
                    },
                    attributes: ['form_id']
                });
                existingRequests.forEach(r => { userSubmittedMap[r.form_id] = true; });
            }

            fundraisers = await Promise.all(fundraisers.map(async (fundraiser) => {
                const fundraiserData = fundraiser.toJSON();
                
                const collected = parseFloat(fundraiserData.fundraiser_collected_amount) || 0;
                const target = parseFloat(fundraiserData.fundraiser_target_amount) || 1;
                fundraiserData.progress_percentage = Math.min((collected / target) * 100, 100);
                fundraiserData.progressWidth = `${Math.min((collected / target) * 100, 100)}%`;
                
                // Add fundraiser_type
                fundraiserData.fundraiser_type = fundraiserData.fundraiser_type || 'Fundraiser';
                
                // Add charity form data if applicable
                if (fundraiserData.fundraiser_status === 'Waiting_requesters' && fundraiserData.form) {
                    fundraiserData.form_current = fundraiserData.form.current_requesters_number;
                    fundraiserData.form_target = fundraiserData.form.target_requesters_number;
                    fundraiserData.form_id = fundraiserData.form.id;
                    fundraiserData.user_has_submitted = !!userSubmittedMap[fundraiserData.form.id];
                }
                
                if (fundraiserData.user && fundraiserData.user.location) {
                    fundraiserData.user.locationString = await getLocationFromCoordinates(fundraiserData.user.location);
                } else {
                    fundraiserData.user = fundraiserData.user || {};
                    fundraiserData.user.locationString = 'Location not specified';
                }
                
                return fundraiserData;
            }));

        } catch (dbError) {
            console.error('Error fetching fundraisers:', dbError);
            fundraisers = [];
            count = 0;
            hasMore = false;
        }

        res.render('site/category', {
            category: category,
            fundraisers: fundraisers,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            hasMore: hasMore,
            title: category.category_name,
            error: req.query.error,
            authUser: req.user || null,
        });

    } catch (error) {
        console.error('Error fetching category:', error);
        res.redirect('/categories?error=Failed to load category');
    }
};

exports.getCategoryFundraisersAjax = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const offset = (page - 1) * limit;

        const category = await Category.findByPk(categoryId);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Use array_to_string for PostgreSQL array comparison
        const categoryPattern = `%${category.category_name}%`;

        const { count, rows: fundraisers } = await Fundraiser.findAndCountAll({
            where: {
                [Sequelize.Op.and]: [
                    {
                        [Sequelize.Op.or]: [
                            Sequelize.where(
                                Sequelize.fn('array_to_string', Sequelize.col('fundraiser_categories'), ','),
                                { [Sequelize.Op.iLike]: categoryPattern }
                            ),
                            Sequelize.where(
                                Sequelize.fn('array_to_string', Sequelize.col('fundraiser_hashtags'), ','),
                                { [Sequelize.Op.iLike]: categoryPattern }
                            )
                        ]
                    },
                    {
                        fundraiser_status: {
                            [Sequelize.Op.in]: ['incompleted', 'Waiting_requesters', 'create_form']
                        }
                    },
                    { is_blocked: false }
                ]
            },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'full_name', 'email', 'location', 'user_image', 'user_type']
            },
            {
                model: FundraiserForm,
                as: 'form',
                required: false
            }],
            limit: limit,
            offset: offset,
            order: [['created_at', 'DESC']]
        });

        // Get current user for charity form submission check
        const userId = req.user ? req.user.id : null;
        const charityFormIds = fundraisers
            .filter(f => f.fundraiser_status === 'Waiting_requesters' && f.form)
            .map(f => f.form.id);

        let userSubmittedMap = {};
        if (userId && charityFormIds.length > 0) {
            const existingRequests = await FundraiserRequest.findAll({
                where: {
                    form_id: { [Sequelize.Op.in]: charityFormIds },
                    user_id: userId
                },
                attributes: ['form_id']
            });
            existingRequests.forEach(r => { userSubmittedMap[r.form_id] = true; });
        }

        const formattedFundraisers = await Promise.all(fundraisers.map(async (fundraiser) => {
            const fundraiserData = fundraiser.toJSON();
            const collected = parseFloat(fundraiserData.fundraiser_collected_amount) || 0;
            const target = parseFloat(fundraiserData.fundraiser_target_amount) || 1;
            fundraiserData.progress_percentage = Math.min((collected / target) * 100, 100);
            fundraiserData.progressWidth = `${Math.min((collected / target) * 100, 100)}%`;
            
            if (fundraiserData.fundraiser_status === 'Waiting_requesters' && fundraiserData.form) {
                fundraiserData.form_current = fundraiserData.form.current_requesters_number;
                fundraiserData.form_target = fundraiserData.form.target_requesters_number;
                fundraiserData.form_id = fundraiserData.form.id;
                fundraiserData.user_has_submitted = !!userSubmittedMap[fundraiserData.form.id];
            }
            
            if (fundraiserData.user && fundraiserData.user.location) {
                fundraiserData.user.locationString = await getLocationFromCoordinates(fundraiserData.user.location);
            } else {
                fundraiserData.user = fundraiserData.user || {};
                fundraiserData.user.locationString = 'Location not specified';
            }
            return fundraiserData;
        }));

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
        console.error('Error in AJAX category fundraisers:', error);
        res.status(500).json({ error: 'Failed to load fundraisers' });
    }
};