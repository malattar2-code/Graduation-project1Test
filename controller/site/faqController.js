const FAQ = require('../../models/FAQ');

// Get FAQ page (HTML)
exports.getFAQPage = async (req, res) => {
    try {
        const faqs = await FAQ.findAll({ order: [['created_at', 'DESC']] });
        res.render('site/faq', { faqs: faqs, title: 'FAQ Management' });
    } catch (error) {
        res.status(500).render('site/error', { error: 'Failed to load FAQ page' });
    }
};

// Get all FAQs (API)
exports.getFAQsAPI = async (req, res) => {
    try {
        const faqs = await FAQ.findAll({ order: [['created_at', 'DESC']] });
        res.json({ success: true, data: faqs, count: faqs.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get FAQs by type
exports.getFAQsByType = async (req, res) => {
    try {
        const { type } = req.params;
        
        const typeMapping = {
            'about': 'about site',
            'registration': 'registration', 
            'donations': 'donations',
            'fundraisers': 'fundraisers',
            'receiving': 'receiving donations',
            'rewards': 'rewards & ranks',
            'search': 'search',
            'general': 'general'
        };

        const dbType = typeMapping[type] || type;
        
        const faqs = await FAQ.findAll({
            where: { faq_type: dbType },
            order: [['created_at', 'ASC']]
        });
        
        res.json({
            success: true,
            data: faqs,
            type: type,
            count: faqs.length
        });
        
    } catch (error) {
        console.error('Error fetching FAQs by type:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch FAQs'
        });
    }
};

// Add new FAQ
exports.addFAQ = async (req, res) => {
    try {
        const { faq_question, faq_answer, faq_type } = req.body;

        if (!faq_question || !faq_answer) {
            return res.status(400).json({
                success: false,
                message: 'FAQ question and answer are required'
            });
        }

        const newFAQ = await FAQ.create({
            faq_question: faq_question.trim(),
            faq_answer: faq_answer.trim(),
            faq_type: faq_type || 'general'
        });

        res.json({
            success: true,
            message: 'FAQ added successfully',
            data: newFAQ
        });

    } catch (error) {
        console.error('Error adding FAQ:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add FAQ'
        });
    }
};

// Update FAQ
exports.updateFAQ = async (req, res) => {
    try {
        const { id } = req.params;
        const { faq_question, faq_answer, faq_type } = req.body;

        const faq = await FAQ.findByPk(id);
        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found'
            });
        }

        await faq.update({
            faq_question: faq_question || faq.faq_question,
            faq_answer: faq_answer || faq.faq_answer,
            faq_type: faq_type || faq.faq_type,
            updated_at: new Date()
        });

        res.json({
            success: true,
            message: 'FAQ updated successfully',
            data: faq
        });

    } catch (error) {
        console.error('Error updating FAQ:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update FAQ'
        });
    }
};

// Delete FAQ
exports.deleteFAQ = async (req, res) => {
    try {
        const { id } = req.params;

        const faq = await FAQ.findByPk(id);
        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found'
            });
        }

        await faq.destroy();

        res.json({
            success: true,
            message: 'FAQ deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting FAQ:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete FAQ'
        });
    }
};

// Get recent FAQs for homepage
exports.getRecentFAQs = async (req, res) => {
    try {
        const faqs = await FAQ.findAll({
            order: [['created_at', 'DESC']],
            limit: 5
        });
        
        res.json({
            success: true,
            data: faqs,
            count: faqs.length
        });
        
    } catch (error) {
        console.error('Error fetching recent FAQs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recent FAQs'
        });
    }
};