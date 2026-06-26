const Fundraiser = require('../../models/Fundraiser');
const FundraiserForm = require('../../models/FundraiserForm');
const FundraiserRequest = require('../../models/FundraiserRequest');
const Category = require('../../models/Category');
const User = require('../../models/User');
const SavedFundraiser = require('../../models/SavedFundraiser');
const Hashtag = require('../../models/Hashtag');
const { Op, Sequelize } = require('sequelize');
const Fuse = require('fuse.js');
const axios = require('axios');
const { getLocationFromCoordinates } = require('../../utils/geolocation');

// ============================================
// FUNDRAISER FORMATTING & SEARCH HELPERS
// ============================================

async function formatFundraiserData(fundraiser) {
    const collected = parseFloat(fundraiser.fundraiser_collected_amount).toLocaleString('en') || 0;
    const target = parseFloat(fundraiser.fundraiser_target_amount).toLocaleString('en') || 1;
    const progress = Math.min((collected / target) * 100, 100);
    
    const userLocation = fundraiser.user ? 
        await getLocationFromCoordinates(fundraiser.user.location) : 
        'Unknown Location';
    
    return {
        fundraiser_id: fundraiser.fundraiser_id,
        public_id: fundraiser.public_id,
        fundraiser_title: fundraiser.fundraiser_title,
        fundraiser_description: fundraiser.fundraiser_description,
        fundraiser_main_image: fundraiser.fundraiser_main_image,
        fundraiser_collected_amount: collected.toLocaleString(),
        fundraiser_target_amount: target.toLocaleString(),
        fundraiser_categories: fundraiser.fundraiser_categories || [],
        fundraiser_hashtags: fundraiser.fundraiser_hashtags || [],
        fundraiser_status: fundraiser.fundraiser_status,
        is_urgent: fundraiser.is_urgent,
        fundraiser_user_id: fundraiser.fundraiser_user_id,
        progress: Math.round(progress),
        progressWidth: `${progress}%`,
        user_name: fundraiser.user ? fundraiser.user.full_name : 'Unknown User',
        user_image: fundraiser.user ? fundraiser.user.user_image : '/images/default-profile.png',
        user_type: fundraiser.user ? fundraiser.user.user_type : null,
        user_location: userLocation,
        created_at: fundraiser.created_at
    };
}

// FUZZY SEARCH HELPERS (Fuse.js + cached vocabulary)
let vocabCache = null;
let vocabCacheTime = 0;

async function getSearchVocabulary() {
  const now = Date.now();
  if (vocabCache && (now - vocabCacheTime) < 5 * 60 * 1000) return vocabCache;

  const [categories, hashtags] = await Promise.all([
    Category.findAll({ attributes: ['category_name'], raw: true }),
    Hashtag.findAll({ attributes: ['tag_name'], order: [['usage_count','DESC']], limit: 300, raw: true })
  ]);

  vocabCache = [
    ...categories.map(c => ({ type: 'category', value: c.category_name.toLowerCase() })),
    ...hashtags.map(h => ({ type: 'hashtag', value: h.tag_name.toLowerCase() }))
  ];
  vocabCacheTime = now;
  return vocabCache;
}

function findFuzzyMatches(query, vocabulary) {
  if (!query || query.length < 2) return [];
  const fuse = new Fuse(vocabulary, {
    keys: ['value'],
    threshold: 0.4,
    distance: 100,
    minMatchCharLength: 2,
    ignoreLocation: true
  });
  return fuse.search(query.toLowerCase()).map(r => r.item.value);
}

async function buildSmartSearchWhereClause(searchQuery, categoryFilter) {
  let conditions = [];

  if (categoryFilter) {
    conditions.push({
      [Op.or]: [
        Sequelize.where(
          Sequelize.fn('array_to_string', Sequelize.col('fundraiser_categories'), ','),
          { [Op.iLike]: `%${categoryFilter}%` }
        ),
        Sequelize.where(
          Sequelize.fn('array_to_string', Sequelize.col('fundraiser_hashtags'), ','),
          { [Op.iLike]: `%${categoryFilter}%` }
        )
      ]
    });
  }

  if (searchQuery) {
    const cleanQuery = searchQuery.replace(/[^\w\s\u0600-\u06FF]/gi, '').trim();
    const words = cleanQuery.split(/\s+/).filter(w => w.length > 0);

    if (words.length > 0) {
      const vocabulary = await getSearchVocabulary();
      const fuzzyTerms = [];
      words.forEach(w => fuzzyTerms.push(...findFuzzyMatches(w, vocabulary)));
      
      const allTerms = [...new Set([...words, ...fuzzyTerms].map(t => t.toLowerCase()))];

      const wordConditions = allTerms.map(word => {
        const pattern = `%${word}%`;
        return {
          [Op.or]: [
            { fundraiser_title: { [Op.iLike]: pattern } },
            { fundraiser_description: { [Op.iLike]: pattern } },
            Sequelize.where(
              Sequelize.fn('array_to_string', Sequelize.col('fundraiser_categories'), ','),
              { [Op.iLike]: pattern }
            ),
            Sequelize.where(
              Sequelize.fn('array_to_string', Sequelize.col('fundraiser_hashtags'), ','),
              { [Op.iLike]: pattern }
            )
          ]
        };
      });

      conditions.push({ [Op.or]: wordConditions });
    }
  }

  return conditions.length > 0 ? { [Op.and]: conditions } : {};
}

// ============================================
// SECTION FETCHERS
// ============================================

async function getCharityFundraisers(page = 1, limit = 9, req) {
    try {
        const offset = (page - 1) * limit;
        const userId = req.user ? req.user.id : null;
        
        const { count, rows: fundraisers } = await Fundraiser.findAndCountAll({
            where: {
                fundraiser_status: 'Waiting_requesters',
                fundraiser_type: { [Op.in]: ['Fundraiser', 'Donation'] },
                is_blocked: false
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['full_name', 'location', 'user_image', 'user_type']
                },
                {
                    model: FundraiserForm,
                    as: 'form',
                    required: true,
                    where: Sequelize.where(
                        Sequelize.col('form.current_requesters_number'),
                        Op.lt,
                        Sequelize.col('form.target_requesters_number')
                    )
                }
            ],
            order: [['created_at', 'DESC']],
            limit: limit,
            offset: offset
        });

        const formattedFundraisers = await Promise.all(
            fundraisers.map(async (fundraiser) => {
                const formatted = await formatFundraiserData(fundraiser);
                
                if (userId && fundraiser.form) {
                    const existingRequest = await FundraiserRequest.findOne({
                        where: {
                            form_id: fundraiser.form.id,
                            user_id: userId
                        }
                    });
                    formatted.user_has_submitted = !!existingRequest;
                } else {
                    formatted.user_has_submitted = false;
                }
                
                formatted.form_current = fundraiser.form.current_requesters_number;
                formatted.form_target = fundraiser.form.target_requesters_number;
                formatted.form_id = fundraiser.form.id;
                
                return formatted;
            })
        );

        const totalPages = Math.ceil(count / limit);
        const hasMore = page < totalPages;

        return {
            fundraisers: formattedFundraisers,
            currentPage: page,
            totalPages: totalPages,
            hasMore: hasMore,
            totalCount: count
        };
    } catch (error) {
        console.error('Error fetching charity fundraisers:', error);
        console.error('SQL Error:', error.original?.sql);
        return {
            fundraisers: [],
            currentPage: 1,
            totalPages: 1,
            hasMore: false,
            totalCount: 0
        };
    }
}

async function getLatestFundraisers(page = 1, limit = 9) {
    try {
        const offset = (page - 1) * limit;
        
        const { count, rows: fundraisers } = await Fundraiser.findAndCountAll({
            where: {
                fundraiser_status: 'incompleted',
                is_blocked: false
            },
            include: [{
                model: User,
                as: 'user',
                attributes: ['full_name', 'location', 'user_image', 'user_type']
            }],
            order: [['created_at', 'DESC']],
            limit: limit,
            offset: offset
        });

        const formattedFundraisers = await Promise.all(
            fundraisers.map(formatFundraiserData)
        );

        const totalPages = Math.ceil(count / limit);
        const hasMore = page < totalPages;

        return {
            fundraisers: formattedFundraisers,
            currentPage: page,
            totalPages: totalPages,
            hasMore: hasMore,
            totalCount: count
        };
    } catch (error) {
        console.error('Error fetching latest fundraisers:', error);
        return {
            fundraisers: [],
            currentPage: 1,
            totalPages: 1,
            hasMore: false,
            totalCount: 0
        };
    }
}

async function getPopularFundraisers(page = 1, limit = 9) {
    try {
        const offset = (page - 1) * limit;
        
        const { count, rows: fundraisers } = await Fundraiser.findAndCountAll({
            where: {
                [Op.and]: [
                    { fundraiser_categories: { [Op.contains]: ['trend'] } },
                    { fundraiser_status: 'incompleted' },
                    { is_blocked: false }
                ]
            },
            include: [{
                model: User,
                as: 'user',
                attributes: ['full_name', 'location', 'user_image', 'user_type']
            }],
            order: [['created_at', 'DESC']],
            limit: limit,
            offset: offset
        });

        const formattedFundraisers = await Promise.all(
            fundraisers.map(formatFundraiserData)
        );

        const totalPages = Math.ceil(count / limit);
        const hasMore = page < totalPages;

        return {
            fundraisers: formattedFundraisers,
            currentPage: page,
            totalPages: totalPages,
            hasMore: hasMore,
            totalCount: count
        };
    } catch (error) {
        console.error('Error fetching popular fundraisers:', error);
        return {
            fundraisers: [],
            currentPage: 1,
            totalPages: 1,
            hasMore: false,
            totalCount: 0
        };
    }
}

function emptyResult() {
    return {
        fundraisers: [],
        currentPage: 1,
        totalPages: 1,
        hasMore: false,
        totalCount: 0
    };
}

async function getLocalFundraisers(req, page = 1, limit = 9) {
    console.log('📍 Starting getLocalFundraisers:', { page, limit });
    
    try {
        const offset = (page - 1) * limit;
        
        const currentUser = await User.findOne({
            where: { id: req.user.id },
            attributes: ['id', 'location']
        });

        if (!currentUser || !currentUser.location) {
            console.log('❌ No current user or user location found');
            return emptyResult();
        }

        const currentUserLocation = await getLocationFromCoordinates(currentUser.location);
        const currentUserCountry = currentUserLocation.split(',').pop().trim();
        
        console.log('🌍 Current user location analysis:', {
            rawLocation: currentUser.location,
            parsedLocation: currentUserLocation,
            country: currentUserCountry
        });

        if (!currentUserCountry || currentUserCountry === 'Unknown Country') {
            console.log('❌ Could not determine current user country');
            return emptyResult();
        }

        console.log(`🔍 Looking for fundraisers in: ${currentUserCountry}`);
        
        const recentFundraisers = await Fundraiser.findAll({
            where: {
                fundraiser_status: 'incompleted',
                is_blocked: false
            },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'full_name', 'location', 'user_image', 'user_type'],
                required: true
            }],
            order: [['created_at', 'DESC']],
            limit: 100
        });

        console.log(`📊 Found ${recentFundraisers.length} recent fundraisers to check`);

        const localFundraisers = [];
        
        for (let i = 0; i < recentFundraisers.length; i++) {
            const fundraiser = recentFundraisers[i];
            
            if (fundraiser.user && fundraiser.user.location) {
                try {
                    const fundraiserLocation = await getLocationFromCoordinates(fundraiser.user.location);
                    const fundraiserCountry = fundraiserLocation.split(',').pop().trim();
                    
                    console.log(`📍 Fundraiser ${i + 1}:`, {
                        title: fundraiser.fundraiser_title,
                        userCountry: fundraiserCountry,
                        matches: fundraiserCountry === currentUserCountry
                    });
                    
                    if (fundraiserCountry === currentUserCountry) {
                        localFundraisers.push(fundraiser);
                        console.log(`✅ ADDED to local: ${fundraiser.fundraiser_title}`);
                    }
                } catch (error) {
                    console.warn(`⚠️ Error processing fundraiser ${fundraiser.fundraiser_id}:`, error.message);
                }
            }
        }

        console.log(`🎯 Found ${localFundraisers.length} local fundraisers`);
        
        if (localFundraisers.length === 0) {
            console.log('❌ No local fundraisers found');
            return emptyResult();
        }

        const startIndex = offset;
        const endIndex = offset + limit;
        const paginatedFundraisers = localFundraisers.slice(startIndex, endIndex);
        
        console.log(`📄 Showing ${paginatedFundraisers.length} of ${localFundraisers.length} local fundraisers`);

        const formattedFundraisers = await Promise.all(
            paginatedFundraisers.map(fundraiser => formatFundraiserData(fundraiser))
        );

        const totalPages = Math.ceil(localFundraisers.length / limit);
        const hasMore = page < totalPages;

        return {
            fundraisers: formattedFundraisers,
            currentPage: page,
            totalPages: totalPages,
            hasMore: hasMore,
            totalCount: localFundraisers.length
        };
    } catch (error) {
        console.error('💥 Error in getLocalFundraisers:', error);
        return emptyResult();
    }
}

async function getSavedFundraisers(req, page = 1, limit = 9) {
    try {
        const offset = (page - 1) * limit;
        
        const currentUser = await User.findOne({
            where: { id: req.user.id }
        });

        if (!currentUser) {
            return emptyResult();
        }

        const { count, rows: savedFundraisers } = await SavedFundraiser.findAndCountAll({
            where: { user_id: currentUser.id },
            include: [{
                model: Fundraiser,
                as: 'fundraiser',
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['full_name', 'location', 'user_image', 'user_type']
                }]
            }],
            order: [['saved_at', 'DESC']],
            limit: limit,
            offset: offset
        });

        const formattedFundraisers = await Promise.all(
            savedFundraisers
                .filter(item => item.fundraiser)
                .map(item => formatFundraiserData(item.fundraiser))
        );

        const totalPages = Math.ceil(count / limit);
        const hasMore = page < totalPages;

        return {
            fundraisers: formattedFundraisers,
            currentPage: page,
            totalPages: totalPages,
            hasMore: hasMore,
            totalCount: count
        };
    } catch (error) {
        console.error('Error fetching saved fundraisers:', error);
        return emptyResult();
    }
}

async function getAlmostDoneFundraisers(page = 1, limit = 9) {
    try {
        const offset = (page - 1) * limit;
        
        const { count, rows: fundraisers } = await Fundraiser.findAndCountAll({
            where: {
                fundraiser_status: 'incompleted',
                is_blocked: false,
                [Op.and]: Sequelize.literal(`
                    (fundraiser_collected_amount / NULLIF(fundraiser_target_amount, 0)) >= 0.75 
                    AND (fundraiser_collected_amount / NULLIF(fundraiser_target_amount, 0)) < 0.99
                `)
            },
            include: [{
                model: User,
                as: 'user',
                attributes: ['full_name', 'location', 'user_image', 'user_type']
            }],
            order: [[Sequelize.literal('(fundraiser_collected_amount / NULLIF(fundraiser_target_amount, 0))'), 'DESC']],
            limit: limit,
            offset: offset
        });

        const formattedFundraisers = await Promise.all(
            fundraisers.map(formatFundraiserData)
        );

        const totalPages = Math.ceil(count / limit);
        const hasMore = page < totalPages;

        return {
            fundraisers: formattedFundraisers,
            currentPage: page,
            totalPages: totalPages,
            hasMore: hasMore,
            totalCount: count
        };
    } catch (error) {
        console.error('Error fetching almost done fundraisers:', error);
        return emptyResult();
    }
}

// ============================================
// FIREBASE SYNC DISABLED
// ============================================
// The following function has been disabled as per requirements 
// to remove Firebase data synchronization and replace uid with id.
/*
async function getFirestoreUser(id) {
    try {
        const { db } = require("../../config/firebase-admin");
        const userDoc = await db.collection("users").doc(id).get();
        
        if (userDoc.exists) {
            return userDoc.data();
        }
        return null;
    } catch (error) {
        console.error('💥 Error getting Firestore user:', error);
        return null;
    }
}
*/

// ============================================
// CONTROLLER CLASS
// ============================================

class AllFundraisersController {
    async getAllFundraisers(req, res) {
        try {
            const searchQuery = req.query.search || '';
            const categoryFilter = req.query.category || '';
            const page = parseInt(req.query.page) || 1;
            const limit = 9;
            const offset = (page - 1) * limit;
            
            const savedPage = parseInt(req.query.savedPage) || 1;
            const savedResult = await getSavedFundraisers(req, savedPage, 9);
            
            const latestPage = parseInt(req.query.latestPage) || 1;
            const popularPage = parseInt(req.query.popularPage) || 1;
            const localPage = parseInt(req.query.localPage) || 1;
            const almostDonePage = parseInt(req.query.almostDonePage) || 1;
            const charityPage = parseInt(req.query.charityPage) || 1;

            console.log('🔍 Search parameters:', { 
                searchQuery, 
                categoryFilter, 
                page,
                savedPage,
                latestPage,
                popularPage,
                localPage,
                almostDonePage
            });
            
            const categories = await Category.findAll({
                attributes: ['category_id', 'category_name'],
                order: [['category_name', 'ASC']]
            });

            const baseWhere = await buildSmartSearchWhereClause(searchQuery, categoryFilter);
            const whereClause = {
                ...baseWhere,
                fundraiser_status: { [Op.in]: ['incompleted', 'Waiting_requesters'] },
                is_blocked: false
            };

            const totalFundraisers = await Fundraiser.count({ where: whereClause });
            const mainFundraisers = await Fundraiser.findAll({
                where: whereClause,
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['full_name', 'location', 'user_image', 'user_type']
                    },
                    {
                        model: FundraiserForm,
                        as: 'form',
                        required: false
                    }
                ],
                order: [['created_at', 'DESC']],
                limit: limit,
                offset: offset
            });

            const userId = req.user ? req.user.id : null;
            const charityFormIds = mainFundraisers
                .filter(f => f.fundraiser_status === 'Waiting_requesters' && f.form)
                .map(f => f.form.id);

            let userSubmittedMap = {};
            if (userId && charityFormIds.length > 0) {
                const existingRequests = await FundraiserRequest.findAll({
                    where: {
                        form_id: { [Op.in]: charityFormIds },
                        user_id: userId
                    },
                    attributes: ['form_id']
                });
                existingRequests.forEach(r => { userSubmittedMap[r.form_id] = true; });
            }

            const mainFormattedFundraisers = await Promise.all(
                mainFundraisers.map(async (fundraiser) => {
                    const formatted = await formatFundraiserData(fundraiser);

                    if (fundraiser.fundraiser_status === 'Waiting_requesters' && fundraiser.form) {
                        formatted.form_current = fundraiser.form.current_requesters_number;
                        formatted.form_target  = fundraiser.form.target_requesters_number;
                        formatted.form_id      = fundraiser.form.id;
                        formatted.user_has_submitted = !!userSubmittedMap[fundraiser.form.id];
                    }

                    return formatted;
                })
            );

            const [
                latestResult,
                popularResult,
                localResult,
                almostDoneResult,
                charityResult
            ] = await Promise.all([
                getLatestFundraisers(latestPage, 9),
                getPopularFundraisers(popularPage, 9),
                getLocalFundraisers(req, localPage, 9),
                getAlmostDoneFundraisers(almostDonePage, 9),
                getCharityFundraisers(charityPage, 9, req)
            ]);
            
            const totalPages = Math.ceil(totalFundraisers / limit);
            const hasMore = page < totalPages;

            res.render('site/all-fundraisers', {
                fundraisers: mainFormattedFundraisers,
                categories: categories.map(cat => cat.category_name),
                searchQuery: searchQuery,
                categoryFilter: categoryFilter,
                title: 'All Fundraisers',
                currentPage: page,
                totalPages: totalPages,
                hasMore: hasMore,
                showPagination: totalFundraisers > limit,
                
                savedFundraisers: savedResult.fundraisers,
                savedCurrentPage: savedResult.currentPage,
                savedTotalPages: savedResult.totalPages,
                savedHasMore: savedResult.hasMore,
                
                latestFundraisers: latestResult.fundraisers,
                latestCurrentPage: latestResult.currentPage,
                latestTotalPages: latestResult.totalPages,
                latestHasMore: latestResult.hasMore,
                
                popularFundraisers: popularResult.fundraisers,
                popularCurrentPage: popularResult.currentPage,
                popularTotalPages: popularResult.totalPages,
                popularHasMore: popularResult.hasMore,
                
                localFundraisers: localResult.fundraisers,
                localCurrentPage: localResult.currentPage,
                localTotalPages: localResult.totalPages,
                localHasMore: localResult.hasMore,
                
                almostDoneFundraisers: almostDoneResult.fundraisers,
                almostDoneCurrentPage: almostDoneResult.currentPage,
                almostDoneTotalPages: almostDoneResult.totalPages,
                almostDoneHasMore: almostDoneResult.hasMore,

                charityFundraisers: charityResult.fundraisers,
                charityCurrentPage: charityResult.currentPage,
                charityTotalPages: charityResult.totalPages,
                charityHasMore: charityResult.hasMore,
                user: req.user || null,
            });

        } catch (error) {
            console.error('💥 Error loading all fundraisers:', error);
            res.render('site/all-fundraisers', {
                fundraisers: [],
                categories: [],
                searchQuery: '',
                categoryFilter: '',
                title: 'All Fundraisers',
                errorMessage: 'Error loading fundraisers: ' + error.message,
                currentPage: 1,
                totalPages: 1,
                hasMore: false,
                showPagination: false,
                savedFundraisers: [],
                savedCurrentPage: 1,
                savedTotalPages: 1,
                savedHasMore: false,
                latestFundraisers: [],
                latestCurrentPage: 1,
                latestTotalPages: 1,
                latestHasMore: false,
                popularFundraisers: [],
                popularCurrentPage: 1,
                popularTotalPages: 1,
                popularHasMore: false,
                localFundraisers: [],
                localCurrentPage: 1,
                localTotalPages: 1,
                localHasMore: false,
                almostDoneFundraisers: [],
                almostDoneCurrentPage: 1,
                almostDoneTotalPages: 1,
                almostDoneHasMore: false,
                charityFundraisers: [],
                charityCurrentPage: 1,
                charityTotalPages: 1,
                charityHasMore: false,
                user: req.user || null,
            });
        }
    }

    async loadMoreFundraisers(req, res) {
        try {
            const section = req.query.section;
            const page = parseInt(req.query.page) || 1;
            const searchQuery = req.query.search || '';
            const categoryFilter = req.query.category || '';
            
            let result;
            
            switch(section) {
                case 'latest':
                    result = await getLatestFundraisers(page);
                    break;
                case 'popular':
                    result = await getPopularFundraisers(page);
                    break;
                case 'local':
                    result = await getLocalFundraisers(req, page);
                    break;
                case 'almostDone':
                    result = await getAlmostDoneFundraisers(page);
                    break;
                case 'saved':
                    result = await getSavedFundraisers(req, page);
                    break;
                case 'search': {
                    const limit = 9;
                    const offset = (page - 1) * limit;

                    const baseWhere = await buildSmartSearchWhereClause(searchQuery, categoryFilter);
                    const whereClause = {
                        ...baseWhere,
                        fundraiser_status: { [Op.in]: ['incompleted', 'Waiting_requesters'] },
                        is_blocked: false
                    };

                    const { count, rows: fundraisers } = await Fundraiser.findAndCountAll({
                        where: whereClause,
                        include: [
                            {
                                model: User,
                                as: 'user',
                                attributes: ['full_name', 'location', 'user_image', 'user_type']
                            },
                            {
                                model: FundraiserForm,
                                as: 'form',
                                required: false
                            }
                        ],
                        order: [['created_at', 'DESC']],
                        limit: limit,
                        offset: offset
                    });

                    const userId = req.user ? req.user.id : null;
                    const charityFormIds = fundraisers
                        .filter(f => f.fundraiser_status === 'Waiting_requesters' && f.form)
                        .map(f => f.form.id);

                    let userSubmittedMap = {};
                    if (userId && charityFormIds.length > 0) {
                        const existingRequests = await FundraiserRequest.findAll({
                            where: {
                                form_id: { [Op.in]: charityFormIds },
                                user_id: userId
                            },
                            attributes: ['form_id']
                        });
                        existingRequests.forEach(r => { userSubmittedMap[r.form_id] = true; });
                    }

                    const formattedFundraisers = await Promise.all(
                        fundraisers.map(async (fundraiser) => {
                            const formatted = await formatFundraiserData(fundraiser);

                            if (fundraiser.fundraiser_status === 'Waiting_requesters' && fundraiser.form) {
                                formatted.form_current = fundraiser.form.current_requesters_number;
                                formatted.form_target  = fundraiser.form.target_requesters_number;
                                formatted.form_id      = fundraiser.form.id;
                                formatted.user_has_submitted = !!userSubmittedMap[fundraiser.form.id];
                            }

                            return formatted;
                        })
                    );

                    result = {
                        fundraisers: formattedFundraisers,
                        currentPage: page,
                        totalPages: Math.ceil(count / limit),
                        hasMore: page < Math.ceil(count / limit),
                        totalCount: count
                    };
                    break;
                }
                default:
                    return res.status(400).json({ error: 'Invalid section' });
            }
            
            res.json(result);
            
        } catch (error) {
            console.error('Error loading more fundraisers:', error);
            res.status(500).json({ error: 'Failed to load more fundraisers' });
        }
    }

    async debugLocationParsing(req, res) {
        try {
            const currentUser = await User.findOne({
                where: { id: req.user.id },
                attributes: ['id', 'location']
            });

            if (!currentUser) {
                return res.json({ error: 'User not found' });
            }

            const sampleFundraiser = await Fundraiser.findOne({
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'location'],
                    required: true
                }],
                order: [['created_at', 'DESC']]
            });

            const debugInfo = {
                currentUser: {
                    id: currentUser.id,
                    rawLocation: currentUser.location,
                    locationType: typeof currentUser.location,
                    parsedLocation: await getLocationFromCoordinates(currentUser.location),
                    country: (await getLocationFromCoordinates(currentUser.location)).split(',').pop().trim()
                },
                sampleFundraiser: sampleFundraiser ? {
                    id: sampleFundraiser.fundraiser_id,
                    user: {
                        id: sampleFundraiser.user.id,
                        rawLocation: sampleFundraiser.user.location,
                        locationType: typeof sampleFundraiser.user.location,
                        parsedLocation: await getLocationFromCoordinates(sampleFundraiser.user.location),
                        country: (await getLocationFromCoordinates(sampleFundraiser.user.location)).split(',').pop().trim()
                    }
                } : null,
            };

            res.json(debugInfo);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getPopularHashtags(req, res) {
        try {
            const { q, limit = 30 } = req.query;
            const where = q ? { tag_name: { [Op.iLike]: `%${q}%` } } : {};
            const hashtags = await Hashtag.findAll({
                where,
                order: [['usage_count', 'DESC']],
                limit: parseInt(limit) || 30,
                attributes: ['tag_name', 'usage_count']
            });
            res.json(hashtags);
        } catch (error) {
            console.error('Error fetching hashtags:', error);
            res.status(500).json({ error: 'Failed to fetch hashtags' });
        }
    }

    async extractHashtags(req, res) {
        try {
            const { title } = req.body;
            if (!title) return res.json({ suggested: [] });

            const stopWords = new Set([
                'the','a','an','in','on','at','for','to','of','and','or','from','is','are','was','were',
                'be','been','being','have','has','had','do','does','did','will','would','could','should',
                'may','might','must','shall','can','need','dare','ought','used','but','if','then','else',
                'when','where','why','how','all','any','both','each','few','more','most','other','some',
                'such','no','nor','not','only','own','same','so','than','too','very','just','now','also',
                'back','after','use','two','way','even','new','want','because','give','day','us',
                'من','في','على','إلى','عن','هذا','هذه','التي','الذي','و','أو','لا','كان','يكون','قد',
                'كل','بعد','قبل','عند','مع','هو','هي','أنا','أنت','نحن','التبرع','حملة','حملات','للتبرع'
            ]);

            const words = title.toLowerCase()
                .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
                .split(/\s+/)
                .filter(w => w.length > 2 && !stopWords.has(w));

            const existing = await Hashtag.findAll({
                where: { tag_name: { [Op.in]: words } },
                order: [['usage_count', 'DESC']],
                limit: 5
            });

            const existingNames = existing.map(h => h.tag_name);
            const combined = [...new Set([...existingNames, ...words])];
            
            res.json({ suggested: combined.slice(0, 6) });
        } catch (error) {
            console.error('Error extracting hashtags:', error);
            res.status(500).json({ error: 'Failed to extract hashtags' });
        }
    }
}

module.exports = new AllFundraisersController();