// middleware/addUserId.js
const User = require('../models/User');

const addUserId = async (req, res, next) => {
    try {
        // req.user should already be set by requireAuth (Firebase user)
        if (req.user && req.user.uid) {
            // Find the user in PostgreSQL by firebase_uid
            const dbUser = await User.findOne({
                where: { firebase_uid: req.user.uid }
            });
            
            if (dbUser) {
                // Add the database user ID to req.user
                req.user.id = dbUser.id;
                req.user.dbUser = dbUser; // Optional: add full user object
                console.log('Database user ID found:', dbUser.id);
            } else {
                console.log('No database user found for Firebase UID:', req.user.uid);
                // Continue anyway, we'll handle this in the route
            }
        }
        next();
    } catch (error) {
        console.error('Error in addUserId middleware:', error);
        // Don't block the request, just continue
        next();
    }
};

module.exports = addUserId;