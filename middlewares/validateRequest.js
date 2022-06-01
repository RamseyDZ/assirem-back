const _HTTP_STATUS_CODES = require("./_httpStatusCodes");

module.exports = validateRequest;

function validateRequest(req, next, schema) {
    const options = {
        abortEarly: false, // include all errors
        allowUnknown: true, // ignore unknown props
        stripUnknown: true // remove unknown props
    };
    const { error, value } = schema.validate(req.body, options);
    if (error) {
        next({message : `Validation error: ${error.details.map(x => x.message).join(', ')}`, statusCode: _HTTP_STATUS_CODES.BAD_REQUEST});
    } else {
        req.body = value;
        next();
    }
}