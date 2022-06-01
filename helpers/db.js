const mongoose= require('mongoose');

const connectionOptions = { useNewUrlParser: true, useUnifiedTopology: true };

const connectDB=async()=>{
    try{
        const conn = await mongoose.connect(process.env.dbURI,connectionOptions);
        mongoose.Promise = global.Promise;
        console.log(`MongoDB Created:${conn.connection.host}`);
    } catch(err){
        console.log("Erreur: erreur lors la connexion au base de données", err)
    }
}

function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

module.exports= {
                    connectDB,
                    User : require('./../models/UserModel'), 
                    Car : require('./../models/CarModel'), 
                    RefreshToken : require('../models/refreshTokenModel'), 
                    isValidId
                } ;