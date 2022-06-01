const _HTTP_STATUS_CODES = require('../middlewares/_httpStatusCodes');
const CarService= require('../services/CarService');
const ErrorResponse = require('../middlewares/_errorResponse');


// function addCarRequest(req, res, next) {
//     const body = req.body; 
//     const originalname = req.file.originalname; 
//     const buffer = req.file.buffer; 
//     CarService.addCar({body, originalname, buffer})
//         .then(async(result) => {
//             console.log("saved car controller : ", result)
//             res.status(_HTTP_STATUS_CODES.CREATED)
//             .json({
//                 success: true, 
//                 data: result
//             });
//         })
//         .catch((error)=>{
//             console.log("erreur : ", error)
//             // next(error)   
//             throw new ErrorResponse(error.message,  400)         
//         });
// }


module.exports = {
    addCarRequest, 
}