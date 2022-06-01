const ErrorResponse = require('../middlewares/_errorResponse');
const UserService= require('../services/UserService');


function loginRequest(req, res, next) {
    const { email, password } = req.body;
    console.log(req.body)
    const ipAddress = req.ip;
    UserService._authenticate({ email, password, ipAddress })
        .then(({ refreshToken, ...user }) => {
            setTokenCookie(res, refreshToken);
            console.log("user : ", user)
            return res.status(200).json(user);
        })
        .catch((error)=>{
            return next(new ErrorResponse(error.message, 401))            
        });
}

module.exports = {
    loginRequest, 
}


// Helpers 
function setTokenCookie(res, token) {
    // create cookie with refresh token that expires in 7 days
    const cookieOptions = {
        httpOnly: true,
        //sameSite: "None", 
        expires: new Date(Date.now() + 15*24*60*60*1000), 
        // secure: true,
    };
    res.cookie('refreshToken', token, cookieOptions);
}