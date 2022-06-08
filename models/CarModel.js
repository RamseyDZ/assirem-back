const mongoose = require("mongoose");


var carSchema = new mongoose.Schema({
    mark: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    firstCirculationDate: {
        type: Date,
    },
    yearModel: {
        type: Number
    },
    kilometers: {
        type: Number,
        default: 0
    },
    fuel: {
        type: String,
        default: ""
    },
    gearBox: {
        type: String,
        enum: ['AUTO','MANUEL'],
        default: "MANUEL"
    },
    type: {
        type: String,
        default: ""
    },
    color: {
        type: String,
        default: ""
    },
    doors: {
        type: Number,
        default: 5
    },
    seats: {
        type: Number,
        default: 5
    },
    fiscale: {
        type: Number
    },
    DIN: {
        type: Number
    },
    price: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        default: ""
    },
    stateCar: {
        type: String,
        enum: [
            "FREE", "SELLED", "RESERVED"
        ],
        default: "FREE"
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    carImages: [
        {
            link: {type: String}, // Lien d'enregistrement d'une image dans la BDD
            key: {type: String}, // key: the variable used to lacate file on the bucket in order to delete it
        }
    ], // une voiture peut avoir pleusieurs images donc (tableau des URL des Images)
    createdAt: {
        type: Date,
        default: Date.now
    }, 
    selledAt: {
        type:Date, 
        default: Date.now
    }, 
    lastUpdatedAt : {type: Date, default: Date.now}
});


module.exports = mongoose.model("Car", carSchema);
