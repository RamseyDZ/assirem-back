const express = require('express');
const { requireAdmin, requireAuth } = require('../middlewares/jwtokenMiddelware');
const { uploadMulter } = require('../middlewares/uploadAws');
const CarService = require('../services/CarService')

// const { addCar } = require('../services/CarService');
// import all services 

const router= express.Router();
// add a middelware to controle access for APIs

/**********  PUBLIC  ************/
// get All free cars 
router.get('/all/free', CarService.getAllFreeCars); 
// get one car public users
router.get('/one/:idCar', CarService.getCarByIdPublic); 




/**********  ADMIN  ************/
/**********  CREATE  ************/
// add a new car 
router.post('/', uploadMulter.array('files', 16), CarService.addCar); 

/********** READ **************/
// get All cars (admin only)
router.get('/all', requireAuth, requireAdmin, CarService.getAllCarsExisting); 

// get All free cars 
router.get('/all/archived', requireAuth, requireAdmin, CarService.getAllArchivedCars); 
// get one car by it's id 
router.get('/one/admin/:idCar', requireAuth, requireAdmin, CarService.getCarById); 


/********** UPDATE ***********/
// update a car 
router.put('/:idCar',requireAuth, requireAdmin, CarService.updateCar); 
// change the state of a car 
router.put('/state/:idCar',requireAuth, requireAdmin, CarService.changeStateSelledCar); 
// update a car archived state
router.put('/archived/:idCar',requireAuth, requireAdmin, CarService.changeArchivedStateCar); 
// change the state of a car (selled, free, waiting)

// add new pictures to existing car 
router.put('/images/add/:idCar',requireAuth, requireAdmin, uploadMulter.array('files', 16), CarService.addImagesToCar); 
// delete images from a car 
router.put('/images/delete/:idCar',requireAuth, requireAdmin, CarService.deleteImagesFromCar); 

/**********  DELETE *************/
// delete a car 
router.delete('/:idCar',requireAuth, requireAdmin, CarService.deleteCar); 

module.exports= router; 