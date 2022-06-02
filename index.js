const express = require('express'); 
var cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

var morgan = require('morgan')

// interne functions 
const db = require("./helpers/db");
const errorHandler = require('./middlewares/errorHandler'); 


// Import all route instances 
const UserRoutes = require('./routes/UserRoutes')
const CarRoutes = require('./routes/CarRoutes');
const {  CorsSitesList } = require('./config/CorsSite');


//load env vars
dotenv.config({ path: "./config/config.env" });

// run the connection to our DB 
db.connectDB(); 

// create express instance and run it
const app = express();

app.use(morgan('dev')); 
// for parsing application/json
app.use(express.json())
//app.use(jwtCheck)

// default cors options (allowed URLs)
var corsOptions = {
    origin: [...CorsSitesList, process.env.FRONT_URL],
    optionsSuccessStatus: 200,
    credentials: true,
};
// Allow urls bellow to access to our server )
app.use(cors(corsOptions));
app.use(cookieParser());

app.use('/api/user', UserRoutes);
app.use('/api/car', CarRoutes);

// we put this here to catch errors (if we used next(error))
app.use(errorHandler);


const startServer = (port) => {
    try {
        app.listen(port, () => {
            console.log(`Server up and running on ${process.env.NODE_ENV} mode on port ${process.env.PORT}`);
        });
    } catch (error) {
        console.error(error);
        process.exit();
    }
};

const PORT = process.env.PORT || 5055;
startServer(PORT);

module.exports = app;
// Handle rejection
// process.on("unhandledRejection", (err, promise) => {
//     console.log(`Error:${err.message}`);
//     // Closing server & exiting the process
//     server.close(() => process.exit(1));
// });