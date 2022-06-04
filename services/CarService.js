const { s3 } = require('../middlewares/uploadAws');
const Car = require('../models/CarModel');

const ErrorResponse = require('../middlewares/_errorResponse');
const _HTTP_STATUS_CODES = require('../middlewares/_httpStatusCodes');


// get all cars                         =====> OK 
// get all free cars                    =====> OK 
// add car (with upload images)         =====> OK 
// update car data                      =====> OK
// get car by ID                        =====> OK
// delete car (delete images also)      =====> OK
// delete images from car               =====> OK
// mark car as selled                   =====> OK 
// mark car as archived                 =====> OK 
// upload images to existing car        =====> OK 


const addCar = async (req, res, next) => {
    try {

        const {
            mark,
            model,
            firstCirculationDate,
            yearModel,
            kilometers,
            fuel,
            gearBox,
            type,
            color,
            doors,
            seats,
            fiscale,
            DIN,
            price,
            description,

        } = req.body;
        const carData = {
            mark, 
            model,
            firstCirculationDate,
            yearModel,
            kilometers,
            fuel,
            gearBox,
            type,
            color,
            doors,
            seats,
            fiscale,
            DIN,
            price,
            description,
        }
        const file = req.files; 
        console.log("files : ",req.files)
        console.log("body : ", req.body)
        var ResponseData = await _s3UploadPictures(file, mark, model, color, yearModel ); 
        Car.create({...carData, carImages: [...ResponseData]})
            .then((savedCar) =>{
                return res.status(_HTTP_STATUS_CODES.CREATED).json({
                    success: true, 
                    data: savedCar, 
                });
            }).catch(err =>{
                return next(new ErrorResponse(err.message,_HTTP_STATUS_CODES.BAD_REQUEST));
            })    
    } catch (err) {
        console.log("erreur catched : ", err);
        return next(new ErrorResponse(err.message,_HTTP_STATUS_CODES.BAD_REQUEST));
    }

}

const updateCar = async (req, res, next) => {
    try{
        const {
            mark,
            model,
            firstCirculationDate,
            yearModel,
            kilometers,
            fuel,
            gearBox,
            type,
            color,
            doors,
            seats,
            fiscale,
            DIN,
            price,
            description,
        } = req.body;
        const carData = {
            mark, 
            model,
            firstCirculationDate,
            yearModel,
            kilometers,
            fuel,
            gearBox,
            type,
            color,
            doors,
            seats,
            fiscale,
            DIN,
            price,
            description,
        }
        const idCar = req.params.idCar; 

        console.log("car body : ", req.body)
        console.log("car data : ", req.params)

        await Car.findByIdAndUpdate(idCar, {...carData, lastUpdatedAt: Date.now()}, {new: true, upsert: true} )
        .then(updatedCar=>{
            return res.status(200).json({
                success: true, 
                data: updatedCar,
            })
        }).catch(err=>{
            return next(new ErrorResponse(err.message,_HTTP_STATUS_CODES.BAD_REQUEST)); 
        })
    }catch(err){
        return next(new ErrorResponse(err.message,_HTTP_STATUS_CODES.BAD_REQUEST)); 
    }
}

const addImagesToCar = async (req, res, next) => {
    try {
        const idCar = req.params.idCar; 
        const carToUpdate = await Car.findById(idCar); 
        const file = req.files; 
        if(file.length<1) return next(new ErrorResponse("No data found", 405)); 
        var ResponseData = await _s3UploadPictures(file, carToUpdate?.mark, carToUpdate?.model, carToUpdate?.color, carToUpdate?.yearModel); 
        await Car.findByIdAndUpdate(idCar ,{ $push: { carImages: ResponseData } }, {new: true, upsert: true, setDefaultsOnInsert: true})
            .then((updatedCar) =>{
                return res.status(_HTTP_STATUS_CODES.OK).json({
                    success: true, 
                    data: updatedCar, 
                });
            }).catch(err =>{
                return next(new ErrorResponse(err.message,_HTTP_STATUS_CODES.BAD_REQUEST));
            })    
    } catch (err) {
        console.log("erreur catched : ", err);
        return next(new ErrorResponse(err.message,_HTTP_STATUS_CODES.BAD_REQUEST));
    }
}

const changeStateSelledCar = async (req, res, next) => {
    try{        
        const idCar = req.params.idCar; 
        const {stateCar} = req.body;
        await Car.findByIdAndUpdate(idCar, {stateCar, lastUpdatedAt: Date.now()}, {new: true})
        .then(selledCar=>{
            return res.status(200).json({
                success: true, 
                data: selledCar,
            })
        }).catch(err=>{
            return next(new ErrorResponse(err.message,_HTTP_STATUS_CODES.BAD_REQUEST)); 
        })
    }catch(err){
        return next(new ErrorResponse(err.message,_HTTP_STATUS_CODES.BAD_REQUEST)); 
    }
}

const changeArchivedStateCar = async (req, res, next) => {
    try{        
        const idCar = req.params.idCar; 
        const {isArchived} = req.body;
        await Car.findByIdAndUpdate(idCar, {isArchived, lastUpdatedAt: Date.now()}, {new: true})
        .then(archivedCar=>{
            return res.status(200).json({
                success: true, 
                data: archivedCar,
            })
        }).catch(err=>{
            return next(new ErrorResponse(err.message,_HTTP_STATUS_CODES.BAD_REQUEST)); 
        })
    }catch(err){
        return next(new ErrorResponse(err.message,_HTTP_STATUS_CODES.BAD_REQUEST)); 
    }
}

const deleteCar = async (req, res, next) => {
    try{
        const idCar = req.params.idCar;
        const carToDelete = await Car.findById(idCar); 
        if(!carToDelete){
            return next(new ErrorResponse("No car found with this ID, try later please.",_HTTP_STATUS_CODES.BAD_REQUEST));
        }
    
        if(carToDelete?.carImages===[] || carToDelete?.carImages.length === 0 ){
            await Car.findOneAndDelete({_id: idCar})
            .then(()=>{
                console.log("the car had been deleted successfully")
            })
        } else {
            var objects = []; 
            carToDelete?.carImages.map((item) => {
                objects.push({ Key: item.key}); 
            })
            _s3DeletePictures(objects)
            .then(async ()=>{
                await Car.findOneAndDelete({_id: idCar})
                .then(() => {
                    console.log("car with pictures had been deleted succesfully")
                })
            }).catch(err => {
                console.log(err)
                return next(new ErrorResponse(err.message,_HTTP_STATUS_CODES.NOT_ACCEPTABLE));
            })
        }
        return res.status(_HTTP_STATUS_CODES.OK).json({
            success: true,
            message: "car had been deleted successfully"
        })
    } catch(err){
        return next(new ErrorResponse(err.message,_HTTP_STATUS_CODES.BAD_REQUEST));
    }
}

const deleteImagesFromCar = async (req, res, next) => {
    try {
        const idCar = req.params.idCar;         
        const {imagesKeys} = req.body; 
        console.log("imagesKeys : ", imagesKeys)
        _s3DeletePictures(imagesKeys)
            .then(async ()=>{
                console.log("key image : ", imagesKeys[0])
                await Car.findOneAndUpdate({_id: idCar}, {$pull:{ carImages: {key: imagesKeys[0].Key} }}, {new: true})
                .then((carAfterDelete) => {
                    console.log(carAfterDelete.carImages)
                    return res.status(_HTTP_STATUS_CODES.OK).json({
                        success: true,
                        data: carAfterDelete,
                    })
                })
            }).catch(err => {
                console.log("Error : ", err)
                return next(new ErrorResponse(err.message,_HTTP_STATUS_CODES.NOT_ACCEPTABLE));
            })  
    } catch (err) {
        console.log("erreur catched : ", err);
        return next(new ErrorResponse(err.message,_HTTP_STATUS_CODES.BAD_REQUEST));
    }
}

const getAllCarsExisting = async (req, res, next) => {
    try{
        await Car.find()
        .then(allCars=>{
            const statistics = {
                total: allCars.length, 
                reserved: allCars.filter(car => car.stateCar === "RESERVED").length, 
                selled: allCars.filter(car => car.stateCar === "SELLED").length, 
                free: allCars.filter(car => car.stateCar ==="FREE").length,
                archived: allCars.filter(car => car.isArchived === true).length, 
                active: allCars.filter(car => car.isArchived !== true).length, 
            }
            return res.status(200).json({
                success: true, 
                data: allCars,
                statistics: {...statistics}, 
            })
        }).catch(err=>{
            return next(new ErrorResponse(err.message,_HTTP_STATUS_CODES.BAD_REQUEST)); 
        })
    }catch(error){
        return next(new ErrorResponse(error.message,_HTTP_STATUS_CODES.BAD_REQUEST));
    }
}

const getAllArchivedCars = async (req, res, next) => {
    try {
        await Car.find({isArchived: true})
        .then(allArchivedCars=>{
            return res.status(200).json({
                success: true, 
                data: allArchivedCars,
            })
        }).catch(err=>{
            return next(new ErrorResponse(err.message,_HTTP_STATUS_CODES.BAD_REQUEST)); 
        })
    } catch (error) {
        return next(new ErrorResponse(error.message,_HTTP_STATUS_CODES.BAD_REQUEST));
    }
}

const getAllFreeCars = async (req, res, next) => {
    try {
        await Car.find({isArchived: false})
        .then(allFreeCars=>{
            return res.status(200).json({
                success: true, 
                data: allFreeCars,
            })
        }).catch(err=>{
            return next(new ErrorResponse(err.message,_HTTP_STATUS_CODES.BAD_REQUEST)); 
        })
    } catch (error) {
        return next(new ErrorResponse(error.message,_HTTP_STATUS_CODES.BAD_REQUEST));
    }
}

const getCarById = async (req, res, next) => {
    try {
        await Car.findById(req.params.idCar)
        .then(CarById=>{
            if(!CarById){
                return next(new ErrorResponse("Car not found",_HTTP_STATUS_CODES.NOT_FOUND)); 
            }
            return res.status(200).json({
                success: true, 
                data: CarById,
            })
        }).catch(err=>{
            return next(new ErrorResponse(err.message,_HTTP_STATUS_CODES.BAD_REQUEST)); 
        })
    } catch (error) {
        return next(new ErrorResponse(error.message,_HTTP_STATUS_CODES.BAD_REQUEST));
    }
}

const getCarByIdPublic = async (req, res, next) => {
    try {
        await Car.findById(req.params.idCar)
        .then(CarById=>{
            if(CarById && CarById.isArchived){
                return next(new ErrorResponse("Car not found or removed (archived)",_HTTP_STATUS_CODES.NOT_FOUND)); 
            } 
            if(!CarById){
                return next(new ErrorResponse("Car not found",_HTTP_STATUS_CODES.NOT_FOUND)); 
            }
            return res.status(200).json({
                success: true, 
                data: CarById,
            })
        }).catch(err=>{
            return next(new ErrorResponse(err.message ,_HTTP_STATUS_CODES.BAD_REQUEST)); 
        })
    } catch (error) {
        return next(new ErrorResponse(error.message,_HTTP_STATUS_CODES.BAD_REQUEST));
    }
}

/***********************************************/
/**************** Middelwares  *****************/
/***********************************************/
async function _s3UploadPictures(files, mark, model, color, yearModel){
    var ResponseData = []; 
    await Promise.all(
        files.map((item) => {
            let tempKey = `${Date.now()}-${mark}-${model}-${color}-${yearModel}.${item.originalname.split('.').pop()}`
            tempKey.replace(" ", "_")
            var params = {
                Bucket: process.env.BUCKET_AWS,      // bucket that we made earlier
                Key: `${Date.now()}-${mark}-${model}-${color}-${yearModel}.${item.originalname.split('.').pop()}` ,               // Name of the image
                Body: item.buffer,                    // Body which will contain the image in buffer format
                ACL: "public-read-write",                 // defining the permissions to get the public link
                ContentType: "image/jpeg"                 // Necessary to define the image content-type to view the photo in the browser with the link
            };
        
            // uplaoding the photo using s3 instance and saving the link in the database.
            //return s3.upload(params).promise() // wait for the end of this opération 

            return new Promise((resolve, reject) => {
                s3.upload(params, function (err, data) {
                    if (err) {
                        reject(err)
                    } else {
                         console.log("Successfully uploaded data to bucket: ", data.Location);
                        resolve(data);
                    }
                })
            })
        })
    ).then(async imagesUploaded =>{
        console.log("data : ", imagesUploaded)
        imagesUploaded.map(carImage=>{
            ResponseData.push({link: carImage.Location, key: carImage.Key}); 
        }) 
    })
    .catch(error=>{
        console.log(error.message)
    }) 
    return ResponseData; 
}


// This function for delete file from s3 bucket
const _s3DeletePictures = async function (files) {
    try{
        
        console.log("objects : ", files)
        var params = {
            Bucket: process.env.BUCKET_AWS, /* required */
            Delete: { 
              Objects: files
            },
        };
        console.log("Params object: ", params.Delete.Objects)
        
            new Promise((resolve, reject) => {
                s3.deleteObjects(params, function(err, data) {
                    if (err) {
                        console.log(err, err.stack); 
                        reject(err)
                    } // an error occurred
                    else {
                        console.log(data);
                        resolve(data); 
                    }           // successful response
              });
            })
        
    } catch(err){
        console.log("Erreur carched : ", err)
        throw new ErrorResponse(err.message, _HTTP_STATUS_CODES.BAD_REQUEST)
    }
    
};


/***********************************************/
/**** Export Services to use them on routes ****/
/***********************************************/
module.exports = {
    getAllCarsExisting,
    getAllFreeCars,
    getAllArchivedCars, 
    getCarById, 
    getCarByIdPublic,
    addCar, 
    updateCar, 
    addImagesToCar, 
    changeStateSelledCar,
    changeArchivedStateCar,
    deleteCar,
    deleteImagesFromCar,
}