const bcrypt = require('bcryptjs/dist/bcrypt');
const jwtDecode = require('jwt-decode');
const db = require('../helpers/db');
const { roles } = require('../helpers/roles');

const {createToken, hashPasswords, generateJwtToken, generateRefreshToken} = require('../middlewares/jwtokenMiddelware');
const ErrorResponse = require('../middlewares/_errorResponse');
const _HTTP_STATUS_CODES = require('../middlewares/_httpStatusCodes');
const User = require('../models/UserModel');


// fonction d'authentification en utilisant (email, password, ipAddress)
const _authenticate = async ({email, password, ipAddress}) => {
    const userAccount = await db.User.findOne({email}).select('+password');

    console.log("user account: ", userAccount);
    if (! userAccount) {
        throw new ErrorResponse('Email or password is incorrect', _HTTP_STATUS_CODES.BAD_REQUEST);
    } else if (! userAccount.isVerified) {
        throw new ErrorResponse('Your account had not been verified yet', _HTTP_STATUS_CODES.UNAUTHORIZED);
		 
    }
    const isValidPassword = await verifyPassword(password, userAccount.password)
    if (! isValidPassword) {
        throw new ErrorResponse('Email or password is incorrect',_HTTP_STATUS_CODES.FORBIDDEN);
    }
	try {
		// authentication successful so generate jwt and refresh tokens
		const jwtToken = generateJwtToken(userAccount);
		const refreshToken = generateRefreshToken(userAccount, ipAddress);
		console.log("User account : ",userAccount)
		console.log("Refresh token created : ",refreshToken)
	
		// save refresh token
		await refreshToken.save();
	
		// update user last login date :
		await db.User.findOneAndUpdate({
			email
		}, {
			lastLoginDate: new Date()
		}, {
			new: true,
			upsert: false
		});
		// but we have to return the last time we haved logged in (so like this it's working )
		// in this case we don't need to search againt for the right information of the user
	
		// return basic details and tokens
		return {
			... initialInfo(userAccount),
			jwtToken,
			refreshToken: refreshToken.token
		};
	} catch (err) {		
        throw new ErrorResponse(err.message,_HTTP_STATUS_CODES.INTERNAL_SERVER);
		// return err;
	}
}

const signupAdmin = async (req, res) => {
    try {
        const {email: userEmail, lastName: userLastName, firstName: userFirstName, phoneNumber: userPhoneNumber} = req.body;

        const hashedPassword = await hashPasswords(req.body.password);

        const userData = {
            email: userEmail.toLowerCase().trim(),
            lastName: userLastName,
            firstName: userFirstName,
            phoneNumber: userPhoneNumber,
            password: hashedPassword,
            role: roles.ADMIN
        };

        const existingEmail = await User.findOne({email: userData.email}).lean();

        if (existingEmail) {
            return res.status(400).json({message: 'Email already exists'});
        }

        const newUser = new User(userData);
        const savedUser = await newUser.save();

        if (savedUser) {
            const token = createToken(savedUser);
            const decodedToken = jwtDecode(token);
            const expiresAt = decodedToken.exp;

            const {nom, prenom, email, role} = savedUser;

            const userInfo = {
                nom,
                prenom,
                email,
                role
            };

            return res.cookie("access_token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'PRODUCTION',
                domain: "apptcc.fr",
                encode: String
            }).json({message: 'User created!', token, userInfo, expiresAt});
        } else {
            return res.status(400).json({message: 'There was a problem creating your account 1'});
        }
    } catch (err) {
        console.log(err);
        return res.status(405).json({message: 'There was a problem creating your account 2', error: err});
    }

}

const logout = async (req, res) => {
    return res.clearCookie("access_token").status(200).json({message: "Successfully logged out"});
}


/**************************/
/**** helper functions ****/
/**************************/
const verifyPassword = async function (enteredPassword, hashedPassword) {
    try {
        return await bcrypt.compare(enteredPassword, hashedPassword);
    } catch (error) {
        console.log(error);
    }
    return false;
};

function initialInfo(account) {
    const {
        id,
        firstName,
        lastName,
        email,
        phoneNumber,
        role,
        createdAt,
        updatedAt,
        lastLoginDate,
        isVerified
    } = account;
    return {
        id,
        firstName,
        lastName,
        email,
        phoneNumber,
        role,
        createdAt,
        updatedAt,
        lastLoginDate,
        isVerified
    };
}

async function LoginDateUpdate(account) {
    return db.User.findByIdAndUpdate(account._id, {lastLoginDate: new Date()});
}

/***********************************************/
/**** Export Services to use them on routes ****/
/***********************************************/
module.exports = {
    signupAdmin,
    logout,
    _authenticate
}
