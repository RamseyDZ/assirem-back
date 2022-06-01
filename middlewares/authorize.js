const jwt = require('express-jwt');
const db = require('_helpers/db');


const authorize = (roles = []) => {
    // roles param can be a single role string (e.g. Role.User or 'User') 
    // or an array of roles (e.g. [Role.Admin, Role.User] or ['ADMIN', 'USER'])
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return [
        // The decoded JWT payload is available on the request via the user property (req.user).
        jwt({ secret:process.env.JWT_SECRET, algorithms: ['HS256'] }),

        // authorize based on user role
        async (req, res, next) => {
            const userAccount = await db.User.findById(req.user.id);
            // Find all refreshTokens of this user 
            const refreshTokens = await db.RefreshToken.find({ user: userAccount._id });

            // if we specify a role to the request so check if user role is included 
            if (!userAccount || (roles.length && !roles.includes(userAccount.role))) {
                // account no longer exists or role not authorized
                return res.status(401).json({ message: 'Unauthorized' });
            }

            // authentication and authorization successful
            req.user.role = userAccount.role;
            // in this list of refreshTokens find that one wich has the same token of the current used
            req.user.ownsToken = token => !!refreshTokens.find(x => x.token === token);
            next();
        }
    ];
}

module.exports = authorize;