const express = require('express');
const Joi = require('joi'); // lib to validate object schema (email, ip , ...etc) 
const { requireAuth, generateRefreshToken, getRefreshToken, revokeToken } = require('../middlewares/jwtokenMiddelware');
const validateRequest = require('../middlewares/validateRequest');
const UserService= require('../services/UserService');
const UserController = require('../controllers/UserController')
// import all services 

const router= express.Router();
// add a middelware to controle access for APIs 


router.post('/admin/signup',registerAdminSchema, UserService.signupAdmin);
router.post('/client/signup',registerSchema, UserService.signupAdmin);
router.post('/login', loginSchema, UserController.loginRequest);
router.get('/logout', requireAuth, UserService.logout);
router.get('/refresh',  getRefreshToken);
router.post('/revoke',  revokeToken);


module.exports= router; 



// helpers : (check if the entred values are correct)
function loginSchema(req, res, next) {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function registerSchema(req, res, next) {
    const schema = Joi.object({
        title: Joi.string().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
        acceptTerms: Joi.boolean().valid(true).required()
    });
    validateRequest(req, next, schema);
}
function registerAdminSchema(req, res, next) {
    const schema = Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    });
    validateRequest(req, next, schema);
}

function verifyEmailSchema(req, res, next) {
    const schema = Joi.object({
        token: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function forgotPasswordSchema(req, res, next) {
    const schema = Joi.object({
        email: Joi.string().email().required()
    });
    validateRequest(req, next, schema);
}