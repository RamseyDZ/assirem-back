const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require("crypto");


const ErrorResponse = require('./_errorResponse');
const db = require('../helpers/db');
const _HTTP_STATUS_CODES = require('./_httpStatusCodes');

// Créer un token
exports.createToken = user => { // Sign the JWT
    if (!user.role) {
        throw new Error('No user role specified');
    }
    return jwt.sign({
        sub: user._id,
        email: user.email,
        role: user.role,
        iss: 'api.assirem91',
        aud: 'api.assirem91'
    }, process.env.JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: '15d'
    });
};

// Protéger un route

// Route autorisé que pour l'admin
exports.requireAdmin = (req, res, next) => { // Not connected user
    if (!req.user) {
        return res.status(401).json({message: 'There was a problem authorizing the request'});
    }
    if (req.user.role !== 'ADMIN') {
        return res.status(401).json({message: 'Insufficient role'});
    }
    next();
};

// Route check if the user is connected or no
exports.requireAuth = async (req, res, next) => {
    // const token = req.cookies.refreshToken;
	let token = req.headers["x-access-token"];
	console.log(token)
    if (! token) {
        return next(new ErrorResponse("Authenication required", _HTTP_STATUS_CODES.FORBIDDEN));
    }
    try {
        const dataDecoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await db.User.findById(dataDecoded.id);
		return next();
    } catch(error) {
		console.log(error.message)
        return next(new ErrorResponse(error, _HTTP_STATUS_CODES.FORBIDDEN));
    }}

// Fonction pour crypter un password
exports.hashPasswords = password => {
    return new Promise((resolve, reject) => { // generate a salt at level 12 strength
        bcrypt.genSalt(12, (err, salt) => {
            if (err) {
                reject(err);
            }
            bcrypt.hash(password, salt, (error, hash) => {
                if (error) {
                    reject(error);
                }
                resolve(hash)
            });
        });
    });
};

exports.generateJwtToken = (user) => { // create a jwt token containing the account id that expires in 15 minutes
    return jwt.sign({
        sub: user._id,
        id: user._id
    }, process.env.JWT_SECRET, {expiresIn: '4m'});
}

exports.generateRefreshToken = (user, ipAddress) => { // create a refresh token that expires in 7 days
    return new db.RefreshToken({
        user: user._id,
        token: randomTokenString(),
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdByIp: ipAddress
    });
}

exports.getRefreshToken = async (req, res, next) => {
    const requestToken = req.body.refreshToken || req.cookies.refreshToken;
	console.log("Cookies : ", req.cookies.refreshToken); 

    if (requestToken == null || requestToken == undefined) {
        return next(new ErrorResponse("Refresh Token is required!", 403))
    }

    try {
        let refreshToken = await db.RefreshToken.findOne({token: requestToken});

        if (!refreshToken) {
            return next(new ErrorResponse("Refresh token is not in database!", 403))
        }

        if (!refreshToken.isActive) {
            db.RefreshToken.findByIdAndRemove(refreshToken._id, {useFindAndModify: false}).exec();
            return next(new ErrorResponse("Refresh token was expired. Please make a new signin request", 403))
        }

        // if the refresh token is valid so return a new access token
        let newAccessToken = this.generateJwtToken(refreshToken?.user);
		let userConnected = await db.User.findById(refreshToken?.user); 

        return res.status(200).json({jwtToken: newAccessToken, refreshToken: refreshToken.token, role: userConnected.role ,email: userConnected.email});
    } catch (err) {
        return next(new ErrorResponse(err.message, 500))
    }
};


exports.revokeToken = async (req, res, next) => { // accept token from request body or cookie
    const token = req.body.refreshToken || req.cookies.refreshToken;
    const ipAddress = req.ip;

    if (! token) {
		return next(new ErrorResponse("Token is required", 400)); 
	}
    

    // users can revoke their own tokens and admins can revoke any tokens
    // if (!req.user.ownsToken(token) && req.user.role !== Role.Admin) {
    //     return res.status(401).json({message: 'Unauthorized'});
    // }
	let refreshToken = await db.RefreshToken.findOneAndUpdate({token},{revoked: Date.now(), revokedByIp: ipAddress},  {new: true});

	if(refreshToken){
		return res.status(200).json({
			message: "Token revoked", 
			token: refreshToken
		})
	} else {
		return next(new ErrorResponse("Token not exist", 403)); 
	}

}

// helpers

function randomTokenString() {
    return crypto.randomBytes(40).toString('hex');
}

