const { Op } = require('sequelize');
const Fundraiser = require('../models/Fundraiser');
const FundraiserForm = require('../models/FundraiserForm');
const FundraiserRequest = require('../models/FundraiserRequest');

/**
 * Middleware to check if a campaign form is accessible
 * - Blocks if campaign is full (current >= target)
 * - Blocks if user already submitted
 */
async function checkCampaignAccess(req, res, next) {
    try {
        const fundraiserId = req.params.id;
        const userId = req.user.id;

        // Find the fundraiser with its form
        const fundraiser = await Fundraiser.findOne({
            where: { fundraiser_id: fundraiserId },
            include: [{ model: FundraiserForm, as: 'form', required: false }]
        });

        if (!fundraiser) {
            return res.redirect('/all-fundraisers?error=Campaign not found');
        }

        // Check if status allows form filling
        if (fundraiser.fundraiser_status !== 'Waiting_requesters') {
            return res.redirect('/all-fundraisers?error=This campaign is not accepting requests');
        }

        // Check if form exists
        if (!fundraiser.form) {
            return res.redirect('/all-fundraisers?error=Form not found for this campaign');
        }

        // PROBLEM 1: Check if campaign is full
        if (fundraiser.form.current_requesters_number >= fundraiser.form.target_requesters_number) {
            return res.redirect('/all-fundraisers?error=This campaign has reached its target');
        }

        // PROBLEM 2: Check if user already submitted
        const existingRequest = await FundraiserRequest.findOne({
            where: {
                form_id: fundraiser.form.id,
                user_id: userId
            }
        });

        if (existingRequest) {
            return res.redirect('/all-fundraisers?error=You have already filled out this form');
        }

        // All checks passed
        next();
    } catch (error) {
        console.error('Campaign access check error:', error);
        res.redirect('/all-fundraisers?error=Server error');
    }
}

module.exports = { checkCampaignAccess };