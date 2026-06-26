const Comment = require('../../models/Comment');
const User = require('../../models/User');
const Fundraiser = require('../../models/Fundraiser');
const contentModerator = require('../../services/contentModeratorService');

const commentsController = {
  async addComment(req, res) {
    try {
      const { fundraiser_id, comment_text, parent_comment_id } = req.body;
      
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      console.log('📝 Adding comment:', { fundraiser_id, comment_text, userId });

      if (!fundraiser_id || !comment_text || comment_text.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Fundraiser ID and comment text are required'
        });
      }

      if (comment_text.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Comment must be less than 500 characters'
        });
      }

      const violations = await contentModerator.checkText(comment_text);
      const hasHighSeverityViolations = violations.some(v => v.level === 'high');
      const blockReason = hasHighSeverityViolations ? 
        `Automatically blocked: ${violations.map(v => v.message).join(', ')}` : null;

      console.log('🔍 Comment moderation result:', {
        hasViolations: violations.length > 0,
        highSeverity: hasHighSeverityViolations,
        violations: violations
      });

      const user = await User.findOne({
        where: { id: userId },
        attributes: ['id', 'full_name', 'user_image', 'user_type']
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found in database'
        });
      }

      const fundraiser = await Fundraiser.findOne({ where: { public_id: String(fundraiser_id) } });
      if (!fundraiser) {
        return res.status(404).json({
          success: false,
          message: 'Fundraiser not found'
        });
      }

      if (parent_comment_id) {
        const parentComment = await Comment.findByPk(parent_comment_id);
        if (!parentComment) {
          return res.status(404).json({
            success: false,
            message: 'Parent comment not found'
          });
        }
      }

      const comment = await Comment.create({
        fundraiser_id: fundraiser.fundraiser_id,
        user_id: parseInt(user.id),
        comment_text: comment_text.trim(),
        parent_comment_id: parent_comment_id ? parseInt(parent_comment_id) : null,
        is_blocked: hasHighSeverityViolations,
        block_reason: blockReason,
        blocked_at: hasHighSeverityViolations ? new Date() : null
      });

      console.log('✅ Comment created:', {
        id: comment.comment_id,
        is_blocked: comment.is_blocked,
        block_reason: comment.block_reason
      });

      if (hasHighSeverityViolations) {
        return res.json({
          success: true,
          message: 'Your comment has been automatically blocked due to inappropriate content and is not publicly visible.',
          is_blocked: true,
          comment: {
            comment_id: comment.comment_id,
            is_blocked: true,
            block_reason: blockReason
          }
        });
      }

      const newComment = await Comment.findOne({
        where: { comment_id: comment.comment_id },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'full_name', 'user_image', 'user_type']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Comment added successfully',
        is_blocked: false,
        comment: newComment
      });

    } catch (error) {
      console.error('💥 Error adding comment:', error);
      res.status(500).json({
        success: false,
        message: 'Server error occurred while adding comment'
      });
    }
  },

  async getFundraiserComments(req, res) {
    try {
      const { fundraiserId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      // First resolve public_id to integer fundraiser_id
      const fundraiser = await Fundraiser.findOne({ where: { public_id: String(fundraiserId) } });
      if (!fundraiser) {
        return res.status(404).json({ success: false, message: 'Fundraiser not found' });
      }
      const fundraiserIdInt = fundraiser.fundraiser_id;
      console.log('📖 Fetching comments for fundraiser:', fundraiserId);

      const { count, rows: comments } = await Comment.findAndCountAll({
        where: {
          fundraiser_id: fundraiserIdInt,
          parent_comment_id: null,
          is_deleted: false,
          is_blocked: false
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'full_name', 'user_image', 'user_type']
          },
          {
            model: Comment,
            as: 'replies',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'full_name', 'user_image', 'user_type']
              }
            ],
            where: { 
              is_deleted: false,
              is_blocked: false
            },
            required: false
          }
        ],
        order: [
          ['created_at', 'DESC'],
          [{ model: Comment, as: 'replies' }, 'created_at', 'ASC']
        ],
        limit,
        offset
      });

      const formattedComments = comments.map(comment => ({
        comment_id: comment.comment_id,
        comment_text: comment.comment_text,
        created_at: comment.created_at,
        user: {
          id: comment.user.id,
          full_name: comment.user.full_name,
          user_image: comment.user.user_image || '/assets/image/Fundraiser-Page/header-sec/girl-profile.png',
          user_type: comment.user.user_type
        },
        replies: comment.replies.map(reply => ({
          comment_id: reply.comment_id,
          comment_text: reply.comment_text,
          created_at: reply.created_at,
          user: {
            id: reply.user.id,
            full_name: reply.user.full_name,
            user_image: reply.user.user_image || '/assets/image/Fundraiser-Page/header-sec/girl-profile.png',
            user_type: reply.user.user_type
          }
        }))
      }));

      res.json({
        success: true,
        comments: formattedComments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalComments: count,
          hasMore: page * limit < count
        }
      });

    } catch (error) {
      console.error('💥 Error fetching comments:', error);
      res.status(500).json({
        success: false,
        message: 'Server error occurred while fetching comments'
      });
    }
  },

  async deleteComment(req, res) {
    try {
      const { commentId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const user = await User.findOne({
        where: { id: userId },
        attributes: ['id']
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const comment = await Comment.findOne({
        where: { comment_id: commentId, user_id: user.id }
      });

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found or unauthorized'
        });
      }

      await comment.update({ is_deleted: true });

      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });

    } catch (error) {
      console.error('💥 Error deleting comment:', error);
      res.status(500).json({
        success: false,
        message: 'Server error occurred while deleting comment'
      });
    }
  }
};

module.exports = commentsController;