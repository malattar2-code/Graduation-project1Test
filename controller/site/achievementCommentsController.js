const AchievementComment = require('../../models/AchievementComment');
const User = require('../../models/User');
const { Op } = require('sequelize');
// Resolve public_id to internal achievement id
const { FundraiserAchievement } = require('../../models/associations');
// ============================================================
// POST /api/achievement/:achievementId/comment
// ============================================================
async function addComment(req, res) {
  try {
    const achievement = await FundraiserAchievement.findOne({
      where: { public_id: req.params.achievementId }
    });
    const achievementId = achievement ? achievement.id : parseInt(req.params.achievementId);
    const { comment_text, parent_comment_id } = req.body;
    const userId = req.session?.user?.id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Login required' });
    }

    if (!comment_text || !comment_text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const trimmedText = comment_text.trim();
    if (trimmedText.length > 500) {
      return res.status(400).json({ success: false, message: 'Comment exceeds 500 characters' });
    }

    const blockedWords = ['spam', 'abuse', 'hate'];
    const hasBlockedWord = blockedWords.some(word =>
      trimmedText.toLowerCase().includes(word)
    );

    const isBlocked = hasBlockedWord;
    const blockMessage = isBlocked
      ? 'Your comment contains inappropriate language and has been submitted for review.'
      : '';

    const result = await AchievementComment.create({
      achievement_id: achievementId,
      user_id: userId,
      comment_text: trimmedText,
      parent_comment_id: parent_comment_id || null,
      is_blocked: isBlocked
    });

    res.json({
      success: true,
      comment_id: result.comment_id,
      created_at: result.created_at,
      is_blocked: isBlocked,
      message: blockMessage || 'Comment added successfully'
    });

  } catch (err) {
    console.error('[addComment] Error:', err);
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
}

// ============================================================
// GET /api/achievement/:achievementId/comments
// ============================================================
async function getAchievementComments(req, res) {
  try {
    const achievement = await FundraiserAchievement.findOne({
      where: { public_id: req.params.achievementId }
    });
    const achievementId = achievement ? achievement.id : parseInt(req.params.achievementId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: comments } = await AchievementComment.findAndCountAll({
      where: {
        achievement_id: achievementId,
        parent_comment_id: null,
        is_blocked: false
      },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    const commentIds = comments.map(c => c.comment_id);

    let repliesMap = {};
    if (commentIds.length > 0) {
      const replies = await AchievementComment.findAll({
        where: {
          parent_comment_id: { [Op.in]: commentIds },
          is_blocked: false
        },
        order: [['created_at', 'ASC']]
      });

      const replierIds = [...new Set(replies.map(r => r.user_id))];
      const replyUsers = await User.findAll({
        where: { id: { [Op.in]: replierIds } },
        attributes: ['id', 'full_name', 'user_image']
      });
      const replyUserMap = {};
      replyUsers.forEach(u => { replyUserMap[u.id] = u; });

      replies.forEach(r => {
        const u = replyUserMap[r.user_id];
        if (!repliesMap[r.parent_comment_id]) repliesMap[r.parent_comment_id] = [];
        repliesMap[r.parent_comment_id].push({
          comment_id: r.comment_id,
          user: {
            user_id: r.user_id,
            full_name: u?.full_name || 'Unknown',
            user_image: u?.user_image || '/assets/image/Fundraiser-Page/header-sec/man-profile.png'
          },
          comment_text: r.comment_text,
          created_at: r.created_at
        });
      });
    }

    const commenterIds = comments.map(c => c.user_id);
    const commentUsers = await User.findAll({
      where: { id: { [Op.in]: commenterIds } },
      attributes: ['id', 'full_name', 'user_image']
    });
    const commentUserMap = {};
    commentUsers.forEach(u => { commentUserMap[u.id] = u; });

    const formattedComments = comments.map(c => {
      const u = commentUserMap[c.user_id];
      return {
        comment_id: c.comment_id,
        user: {
          user_id: c.user_id,
          full_name: u?.full_name || 'Unknown',
          user_image: u?.user_image || '/assets/image/Fundraiser-Page/header-sec/man-profile.png'
        },
        comment_text: c.comment_text,
        created_at: c.created_at,
        replies: repliesMap[c.comment_id] || []
      };
    });

    res.json({
      success: true,
      comments: formattedComments,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
        hasMore: page * limit < count
      }
    });

  } catch (err) {
    console.error('[getAchievementComments] Error:', err);
    res.status(500).json({ success: false, message: 'Failed to load comments' });
  }
}

// ============================================================
// DELETE /api/achievement-comment/:commentId
// ============================================================
async function deleteComment(req, res) {
  try {
    const commentId = parseInt(req.params.commentId);
    const userId = req.session?.user?.id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Login required' });
    }

    const comment = await AchievementComment.findByPk(commentId);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const isOwner = comment.user_id === userId;
    const isAdmin = req.user?.user_type === 'superadmin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    await comment.destroy();

    res.json({ success: true, message: 'Comment deleted' });

  } catch (err) {
    console.error('[deleteComment] Error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
}

module.exports = {
  addComment,
  getAchievementComments,
  deleteComment
};