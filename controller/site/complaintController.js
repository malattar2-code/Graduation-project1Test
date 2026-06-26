const Complaint = require('../../models/Complaint');
const User = require('../../models/User');

// Submit a new complaint
exports.submitComplaint = async (req, res) => {
    try {
        const { complaint_content } = req.body;
        
        if (!complaint_content || !complaint_content.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Complaint content is required'
            });
        }

        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'You must be logged in to submit a complaint'
            });
        }

        const currentUser = await User.findOne({ 
            where: { id: req.user.id } 
        });
        
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found in database'
            });
        }

        const newComplaint = await Complaint.create({
            complaint_content: complaint_content.trim(),
            user_id: currentUser.id,
            user_email: currentUser.email,
            user_full_name: currentUser.full_name,
            status: 'pending'
        });

        res.json({
            success: true,
            message: 'Complaint submitted successfully! We will review it soon.',
            data: {
                complaint_id: newComplaint.complaint_id,
                content: newComplaint.complaint_content,
                status: newComplaint.status,
                created_at: newComplaint.created_at
            }
        });

    } catch (error) {
        console.error('Error submitting complaint:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit complaint. Please try again.'
        });
    }
};

// Get user's complaints
exports.getUserComplaints = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const currentUser = await User.findOne({ 
            where: { id: req.user.id } 
        });

        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const complaints = await Complaint.findAll({
            where: { user_id: currentUser.id },
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: complaints,
            count: complaints.length
        });

    } catch (error) {
        console.error('Error fetching complaints:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch complaints'
        });
    }
};

// Get all complaints (admin)
exports.getAllComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.findAll({
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'full_name', 'email', 'user_type']
            }],
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: complaints,
            count: complaints.length
        });

    } catch (error) {
        console.error('Error fetching all complaints:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch complaints'
        });
    }
};


// Update complaint status
exports.updateComplaintStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'in_progress', 'resolved', 'closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const complaint = await Complaint.findByPk(id);
        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        await complaint.update({
            status: status,
            updated_at: new Date()
        });

        res.json({
            success: true,
            message: 'Complaint status updated successfully',
            data: complaint
        });

    } catch (error) {
        console.error('Error updating complaint status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update complaint status'
        });
    }
};

// ADD THIS METHOD to complaintController.js if not exists
exports.getAdminComplaints = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // With this (no include needed since user data is stored in complaint table):
        const { count, rows: complaints } = await Complaint.findAndCountAll({
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        res.json({
            success: true,
            data: complaints,
            count: complaints.length,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                totalCount: count,
                hasMore: page * limit < count
            }
        });
    } catch (error) {
        console.error('Error fetching admin complaints:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch complaints'
        });
    }
};

// Mark complaint as resolved
exports.resolveComplaint = async (req, res) => {
    try {
        const { id } = req.params;

        const complaint = await Complaint.findByPk(id);
        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        await complaint.update({
            status: 'resolved',
            updated_at: new Date()
        });

        res.json({
            success: true,
            message: 'Complaint marked as resolved',
            data: complaint
        });

    } catch (error) {
        console.error('Error resolving complaint:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resolve complaint'
        });
    }
};

// Delete complaint
exports.deleteComplaint = async (req, res) => {
    try {
        const { id } = req.params;

        const complaint = await Complaint.findByPk(id);
        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        await complaint.destroy();

        res.json({
            success: true,
            message: 'Complaint deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting complaint:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete complaint'
        });
    }
};

// Debug: Get all complaints raw
exports.debugComplaints = async (req, res) => {
    try {
        console.log('🔍 Debug: Testing complaints API directly');
        
        const complaints = await Complaint.findAll({
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'full_name', 'email', 'user_type']
            }],
            order: [['created_at', 'DESC']]
        });

        console.log('🔍 Debug: Raw complaints from database:', complaints.length);
        
        res.json({
            success: true,
            data: complaints,
            count: complaints.length,
            debug: {
                rawCount: complaints.length,
                sample: complaints.length > 0 ? {
                    id: complaints[0].complaint_id,
                    content: complaints[0].complaint_content,
                    userId: complaints[0].user_id,
                    status: complaints[0].status
                } : null
            }
        });

    } catch (error) {
        console.error('🔍 Debug: Error in complaints API:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Debug: Check model associations
exports.debugModelCheck = async (req, res) => {
    try {
        console.log('🔍 Debug: Checking model associations');
        console.log('Complaint model:', Complaint);
        console.log('User model:', User);
        
        const testComplaint = Complaint.build({
            complaint_content: 'Test complaint',
            user_id: 1,
            user_email: 'test@test.com',
            user_full_name: 'Test User',
            status: 'pending'
        });
        
        console.log('🔍 Debug: Test complaint built successfully');
        
        res.json({
            success: true,
            message: 'Model check completed',
            associations: {
                complaintHasUser: !!Complaint.associate,
                userModelExists: !!User
            }
        });

    } catch (error) {
        console.error('🔍 Debug: Error in model check:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};