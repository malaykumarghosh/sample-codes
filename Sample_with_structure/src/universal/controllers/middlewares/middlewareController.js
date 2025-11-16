const {
    validateAuth
} = require("../../helpers/common/authenticationHelper");

const logger = require('../../../logger/logger');
const { getName } = require('../../../logger/logFunctionName');
const jwt_decode = require('jwt-decode');
const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');
const jwk = JSON.parse(process.env.JWK);
// Convert JWK (JSON Web Key) to PEM format
const pem = jwkToPem(jwk);
const db = require('../../../v3/models');

exports.authenticate_bk = (req, res, next) => {
    try {
        logger.info("* Starting %s of %s *", getName().functionName, getName().fileName);
        // check if params are present
        const validatedAuth = validateAuth(req, next);
        if (validatedAuth.success) {
            var token = validatedAuth.data.split(" ")[1];
            if (token && token.trim() != "") {
                var userDetails = jwt_decode(token);
                req.currentUser = userDetails;
                logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
                next();
            } else {
                logger.error(`Invalid token in %s of %s`, getName().functionName, getName().fileName);
                next({ status: 401, message: "Invalid_Authorization_Token" });
                return;
            }
        }
    } catch (err) {
        logger.error(`${err.message || JSON.stringify(err)} in %s of %s`, getName().functionName, getName().fileName);
        next({ message: err.message || JSON.stringify(err) });
        return;
    }
}

exports.authenticate_bks = (req, res, next) => {
    try {
        logger.info("* Starting %s of %s *", getName().functionName, getName().fileName);
        // check if params are present
        const validatedAuth = validateAuth(req, next);
        if (validatedAuth.success) {
            var token = validatedAuth.data.split(" ")[1];
            // Decode and verify the JWT token using the provided PEM key and RS256 algorithm
            let decodedToken = jwt.verify(token, pem, { algorithms: ['RS256'] });
            // Sending user details to all
            var userDetails = jwt_decode(token);
            req.currentUser = userDetails;
            next();
        }
    } catch (err) {
        let errMessage = err.message.replace(/jwt/g, "token");
        errMessage = errMessage[0].toUpperCase() + errMessage.slice(1);
        if(errMessage == 'Token expired') errMessage = 'The incoming token has expired';
        next({ status: errMessage == 'The incoming token has expired'? 401: 500,message: errMessage });
        return;
    }
}

// Authenticate function
exports.authenticate = async(req, res, next) => {
    try {
        console.log(`Request Method: ${req.method}, Request URL: ${req.originalUrl}`);
        let validationSkip = false;
        if(["/api/users/user_details"].includes(req.originalUrl)){
            validationSkip = true;
        }
        console.log('validationSkip------',validationSkip)
        // Validate the authentication parameters from the request
        const validatedAuth = validateAuth(req, next);
        //console.log('validatedAuth:', validatedAuth);

        if (validatedAuth.success) {
            const token = validatedAuth.data.split(" ")[1];

            // Decode and verify the JWT token
            const decodedToken = jwt.verify(token, pem, { algorithms: ['RS256'] });
            let orgDetails;
            try{
                orgDetails = Object.keys(JSON.parse(decodedToken['custom:org_details'])).length == 0? null : JSON.parse(decodedToken['custom:org_details']);
            }catch(err){
                orgDetails = null;
            }
            // Parse and clone user details from the token
            const unmodifiedUserParams = JSON.parse(decodedToken['custom:user_details']);
            const userParams = { ...unmodifiedUserParams };
            if(!orgDetails){ // for friday updated
                if(userParams.user_type!="app_admin" && !validationSkip){
                    if(!req.headers.hasOwnProperty('business_details')){
                        return next({
                            status: 403,
                            message: "Access denied",
                        });
                    }
                }
                const businessDetails = req.headers.hasOwnProperty('business_details') && req.headers.business_details != 'undefined'  ? JSON.parse(req.headers.business_details) : {};
                if(Object.keys(businessDetails).length > 0 && !validationSkip){
                    if(parseInt(userParams.user_id)!=parseInt(businessDetails.user_id)){
                        return next({
                            status: 403,
                            message: "Access denied",
                        });
                    }
                }
                // Update user type and organization ID based on business details
                userParams.user_type = businessDetails.user_type || userParams.user_type;
                userParams.role_id = businessDetails.role_id || userParams.role_id;
                userParams.org_id = businessDetails.org_id || '';
                if(userParams.user_type == "app_admin"){
                    userParams.org_id = '';
                }
                // Update the token with modified and unmodified user details
                decodedToken['custom:user_details'] = JSON.stringify(userParams);
                decodedToken['unmodified_userparams'] = unmodifiedUserParams;
            }
            if(userParams.user_type != "app_admin" && !validationSkip){
                if(userParams.org_id !=""){
                    let orgRelationDetails = await db.OrgUserRelation.findOne({where:{org_id: userParams.org_id,user_id: userParams.user_id}})
                    if(!orgRelationDetails && !validationSkip){
                        return next({
                            status: 401,
                            message: "You are not authorised user for this organisation.",
                        });
                    }
                    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
                    if(filters.hasOwnProperty('org_id') && parseInt(filters.org_id) != parseInt(userParams.org_id) && parseInt(filters.org_id) != 0){
                        return next({
                            status: 401,
                            message: "You are not authorised user for this organisation.",
                        });
                    }
                    if(req.body.hasOwnProperty('org_id') && parseInt(req.body.org_id) != parseInt(userParams.org_id)){
                        return next({
                            status: 401,
                            message: "You are not authorised user for this organisation.",
                        });
                    }
                    const body = req.body;
                    if (Array.isArray(body)) {
                        const orgIdObject = body.find(item => item && item.org_id && parseInt(item.org_id) !==parseInt(userParams.org_id) );
                        if(orgIdObject){
                            return next({
                                status: 401,
                                message: "You are not authorised user for this organisation.",
                            }); 
                        }
                    }
 
                } else {
                    return next({
                        status: 401,
                        message: "You are not authorised user.",
                    });
                }
            }

            // Attach the decoded token to the request object
            req.currentUser = decodedToken;

            return next();
        }
    } catch (err) {
        // Handle token errors with user-friendly messages
        let errorMessage = err.message.replace(/jwt/g, "token");
        errorMessage = errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1);

        if (errorMessage === 'Token expired') {
            errorMessage = 'The incoming token has expired';
        }

        return next({
            status: errorMessage === 'The incoming token has expired' ? 401 : 500,
            message: errorMessage,
        });
    }
};

exports.accessVarificationForListing = (req, res, next) => {
    try {
        var token = req.headers.authorization.split(" ")[1];
        if (token && token.trim() != "") {
            var userDetails = jwt_decode(token);
            let user_type = req.headers?.business_details ? JSON.parse(req.headers?.business_details)?.user_type:"";


            if (user_type == "app_admin") {
                next();
            } else {
                let params_org_id =  req.headers?.business_details ? JSON.parse(req.headers?.business_details)?.org_id:"";
                if (params_org_id!='') {
                    next();
                }
                else {
                    next({ status: 403, message: "Access denied" });
                    return;
                }
            }

        } else {
            logger.error(`Invalid token in %s of %s`, getName().functionName, getName().fileName);
            next({ status: 401, message: "Invalid_Authorization_Token" });
            return;
        }
    } catch (err) {
        logger.error(`${err.message || JSON.stringify(err)} in %s of %s`, getName().functionName, getName().fileName);
        next({ message: err.message || JSON.stringify(err) });
        return;
    }
}

exports.accessVarificationForCreate = (req, res, next) => {
    try {
        var token = req.headers.authorization.split(" ")[1];
        if (token && token.trim() != "") {
            var userDetails = jwt_decode(token);
            let user_type = req.headers?.business_details ? JSON.parse(req.headers?.business_details)?.user_type:"";


            if (user_type == "app_admin") {
                next();
            } else {
                let params_org_id =  req.headers?.business_details ? JSON.parse(req.headers?.business_details)?.org_id:"";
                if (params_org_id!='') {
                    next();
                }
                else {
                    next({ status: 403, message: "Access denied" });
                    return;
                }
            }

        } else {
            logger.error(`Invalid token in %s of %s`, getName().functionName, getName().fileName);
            next({ status: 401, message: "Invalid Authorization Token" });
            return;
        }
    } catch (err) {
        logger.error(`${err.message || JSON.stringify(err)} in %s of %s`, getName().functionName, getName().fileName);
        next({ message: err.message || JSON.stringify(err) });
        return;
    }
}

exports.accessVarificationForNotification = (req, res, next) => {
    try {
        var token = req.headers.authorization.split(" ")[1];
        if (token && token.trim() != "") {
            var userDetails = jwt_decode(token);
            let user_type = req.headers?.business_details ? JSON.parse(req.headers?.business_details)?.user_type:"";
            
            if (user_type == "app_admin") {
                next();
            } else {
                next({ status: 403, message: "Access denied" });
                return;
            }

        } else {
            logger.error(`Invalid token in %s of %s`, getName().functionName, getName().fileName);
            next({ status: 401, message: "Invalid Authorization Token" });
            return;
        }
    } catch (err) {
        logger.error(`${err.message || JSON.stringify(err)} in %s of %s`, getName().functionName, getName().fileName);
        next({ message: err.message || JSON.stringify(err) });
        return;
    }
}

exports.socketAuthenticate = (req, next) => {
    try {
        logger.info("* Starting %s of %s *", getName().functionName, getName().fileName);
        // check if params are present

        let header = req.headers;
        if (!header || Object.keys(header).length == 0) {
            logger.error("Required parameters are missing in  %s of %s", getName().functionName, getName().fileName);
            return ({ success: false, status: 400, message: "Required parameters are missing" });
        } else if (!header.authorization || header.authorization.trim() == "") {
            logger.error("Unauthorized in  %s of %s", getName().functionName, getName().fileName);
            return ({ success: false, status: 401, message: "Unauthorized" });
        } else {
            //return { success: true, data: header.authorization };
            var token = header.authorization.split(" ")[1];
            if (token && token.trim() != "") {
                var userDetails = jwt_decode(token);
                req.currentUser = userDetails;
                logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
                return ({ success: true, userDetails: userDetails })
            } else {
                logger.error(`Invalid token in %s of %s`, getName().functionName, getName().fileName);
                return ({ status: 401, message: "Invalid_Authorization_Token", success: false });
            }
        }
    } catch (err) {
        console.log(err);
        logger.error(`${err.message || JSON.stringify(err)} in %s of %s`, getName().functionName, getName().fileName);
        return ({ message: err.message || JSON.stringify(err) });
    }
}

exports.accessVarificationForBlockedRoomListing = (user_type, next) => {
    try {
        // Check if the user type is one of the authorized roles: app_admin, admin, staff, agent, or agent_staff
        if (!['customer'].includes(user_type)) {
            return ({ success: true });
        } else {
            next({ status: 403, message: "Access denied" });
            return;
        }
    } catch (err) {
        logger.error(`${err.message || JSON.stringify(err)} in %s of %s`, getName().functionName, getName().fileName);
        next({ message: err.message || JSON.stringify(err) });
        return;
    }
}