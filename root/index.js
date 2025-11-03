const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
//const sequelize = require('./database/connection');
require('dotenv').config();
const EV = require('./src/environment');

const router_v3_0_1 = require('./src/v3_0_1/routers');
const router_v4 = require('./src/v4/routers');
const router_v5 = require('./src/v5/routers');
const router_v6 = require('./src/v6/routers');
const logger = require('./src/logger/logger');
const { ENDPOINT_NOT_FOUND_ERR } = require('./src/middlewares/errors/errors');
const { errorHandler } = require('./src/middlewares/errors/errorMiddleware');
var cron = require('node-cron');

const PORT = 6400;
const moment = require('moment');

const http = require("http");

 
const app = express();

const server = http.createServer(app);


app.use(helmet())
app.options('*', cors());
//app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false }));
// 🔹 Special parser only for /api/v3.0.1/dataexchange

app.use(express.raw({ type: 'application/octet-stream' }));

logger.stream = {
    write: (message, encoding) => {
        logger.http(message);
    }
}

app.use(require("morgan")("combined", { "stream": logger.stream }));

app.use(
  express.json({
      limit: '50mb',
    // store the raw request body to use it for signature verification
    verify: (req, res, buf, encoding) => {
      req.rawBody = buf?.toString(encoding || "utf8");
    },
  }),
);

//require("./database/connection");
// const db = require('./src/v3/models');

/// ADDED ///
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*', // set to specific domain in production
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
  credentials: true
};
app.use(cors(corsOptions));
/// ===== ///

app.use('/api/v3.0.1', router_v3_0_1);
app.use('/api/v4', router_v4);
app.use('/api/v5', router_v5);
app.use('/api/v6', router_v6);

app.get('/', (req, res) => {
    res.status(200).json({
        status: 200,
        success: true,
        message: "The application is running. Please ensure proper routing to access the data."
    });
});


//app.disable('x-powered-by')
//If api end point not found
 
app.use('*', (req, res, next) => {
   //res.setHeader("Permissions-Policy", "geolocation=(), interest-cohort=()");// the website does not utilize geolocation or interest cohort tracking features.
   logger.info(`MT Requested URL: ${req.originalUrl}`);
   logger.info(`MT Requested Params: ${req.params}`);
    const error = {
        status: 404,
        message: ENDPOINT_NOT_FOUND_ERR
    };
    next(error);
});

// global error handling middleware
app.use(errorHandler);

main = async () => {
    console.log('connection has been established successfully');
    // if(EV.NODE_ENV === 'development') {
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
main();
