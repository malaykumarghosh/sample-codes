const logger = require('../../../logger/logger');
const { getName } = require('../../../logger/logFunctionName');
const models = require('../../../v3/models');
const Joi = require('joi');


exports.validateAuth = (req, next) => {
    logger.info("* Starting %s of %s *", getName().functionName, getName().fileName);
    try {
        let header = req.headers;
        if (!header || Object.keys(header).length == 0) {
            logger.error("Required parameters are missing in  %s of %s", getName().functionName, getName().fileName);
            next({ success: false, status: 400, message: "Required parameters are missing" });
        } else if (!header.authorization || header.authorization.trim() == "") {
            logger.error("Unauthorized in  %s of %s", getName().functionName, getName().fileName);
            next({ success: false, status: 401, message: "Unauthorized" });
        } else {
            return { success: true, data: header.authorization };
        }
    } catch (err) {
        logger.error(`${err.message || JSON.stringify(err)} in  %s of %s`, getName().functionName, getName().fileName);
        next({ success: false, status: 500, message: err.message || JSON.stringify(err) });
    }
}
exports.validateRequest = (req, modelNames, extraParams = [], excludedFields = ['id', 'createdAt', 'updatedAt']) => {

    if (!Array.isArray(modelNames)) {
        console.log('modelNames should be an array');
        logger.error('modelNames should be an array');
        return {
            status: 400,
            success: false,
            message: 'Invalid inputs',
        };
    }

    const combinedSchemas = {};

    modelNames.forEach((modelName) => {
        const Model = models[modelName];
        if (!Model) {
            console.log(`Model ${modelName} not found`);
			logger.error(`Model ${modelName} not found`);
			return {
				status: 400,
				success: false,
				message: 'Invalid inputs',
			};
        }

        // Extract not-null fields
        const notNullFields = Object.entries(Model.rawAttributes)
            .filter(([, attr]) => attr.allowNull === false)
            .map(([key]) => key);

        // Generate schema for the model
// console.log('-----------------------',Model.rawAttributes)

        Object.keys(Model.rawAttributes).forEach((field) => {
            console.log('===============1==========',field)
            if (excludedFields.includes(field)) return; // Skip excluded fields
            console.log('===============2==========',field)
            
            combinedSchemas[field] = notNullFields.includes(field)
                ? Joi.any().required()
                : Joi.any().allow(); 
        });
    //console.log('notNullFields----',notNullFields)

    });
    // Dynamically validate fields with object structure containing file_name and file_obj
    Object.keys(req).forEach((key) => {
        const value = req[key];
        //console.log('key-----1-----',key)

        if (value && typeof value === 'object' && !Array.isArray(value)) {
            //console.log('key------2----',key)
            combinedSchemas[key] = Joi.object({
                file_name: Joi.string().required(),
                file_obj: Joi.string().required(),
            });
        }
    });

    // Add other parameters to the schema
    extraParams.forEach((param) => {
        combinedSchemas[param] = Joi.any().allow();
    });
     //console.log('combinedSchemas-----',Joi.object(combinedSchemas))

    // Combine all schemas into a single Joi schema
    const schema = Joi.object(combinedSchemas);

    // Validate the request
    const validation = schema.validate(req);

    if (validation.error) {
        logger.error(validation.error.details[0].message);
        return {
            status: 400,
            success: false,
            message: validation.error.details[0].message,
        };
    } else {
        return {
            status: 200,
            success: true,
            data: validation.value,
        };
    }
};


// Format creation data
exports.formatResponseUserCreate = (params) => {
    let result = {};
    if (params.success) {
        result = {
            "status": 200,
            "success": true,
            "message": "User created successfully",
            "data": params.data
        };
    } else if (!params.success) {
        result = {
            "status": 200,
            "success": false,
            "message": params.message,
            "data": params
        };
    }
    return (result);
}


exports.validateUpdateRequest = (req, modelNames, extraParams = [], excludedFields = ['id', 'createdAt', 'updatedAt']) => {
    try{
    if (!Array.isArray(modelNames)) {
        console.log('modelNames should be an array');
        logger.error('modelNames should be an array');
        return {
            status: 400,
            success: false,
            message: 'Invalid inputs',
        };
    }

    const combinedSchemas = {};

    modelNames.forEach((modelName) => {
        if (extraParams.includes(modelName)) return; // skip these
        const Model = models[modelName];
        if (!Model) {
            throw new Error(`Model ${modelName} not found`);
            // console.log(`Model ${modelName} not found`);
            // logger.error(`Model ${modelName} not found`);
            // return {
            //     status: 400,
            //     success: false,
            //     message: 'Invalid inputs',
            // };
        }

        // Extract not-null fields
        const notNullFields = Object.entries(Model.rawAttributes)
            .filter(([, attr]) => attr.allowNull === false)
            .map(([key]) => key);

        // Generate schema for the model
        Object.keys(Model.rawAttributes).forEach((field) => {
            if (excludedFields.includes(field)) return; // Skip excluded fields
            if (!(field in req.body)) return; // Skip fields not present in the request

            combinedSchemas[field] = notNullFields.includes(field)
                ? Joi.any().required()
                : Joi.any().allow();
        });
    });
    // Dynamically validate fields with object structure containing file_name and file_obj
    Object.keys(req.body).forEach((key) => {
        const value = req[key];
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            combinedSchemas[key] = Joi.object({
                file_name: Joi.string().required(),
                file_obj: Joi.string().required(),
            });
        }
    });
    // Add extra parameters to the schema
    extraParams.forEach((param) => {
        combinedSchemas[param] = Joi.any().allow();
    });
    // Combine all schemas into a single Joi schema
    const schema = Joi.object(combinedSchemas); // unknown(false) ensures no extra fields are allowed

    // Validate the request
    const validation = schema.validate(req.body);

    if (validation.error) {
        // Log the error and return the first validation error message
        const errorMessage = validation.error.details[0].message;
        logger.error(errorMessage);
        return {
            status: 400,
            success: false,
            message: errorMessage,
        };
    }

    return {
        status: 200,
        success: true,
        data: validation.value,
        id: req.params.id || null
    };
} catch(err){
    logger.error(err);
}
};


// Format creation data
exports.formatResponseOrgCreate = (params) => {
    let result = {};
    if (params.success) {
        result = {
            "status": 200,
            "success": true,
            "message": "Organisation created successfully",
            "data": params.data
        };
    } else if (!params.success) {
        result = {
            "status": 200,
            "success": false,
            "message": params.message,
            "data": params
        };
    }
    return (result);
}

// Format updation data
exports.formatResponseUpdateData = (params) => {
    let result = {};
    if (params.success) {
        result = {
            "status": 200,
            "success": true,
            "message": params.message,
            "data": params.data
        };
    } else if (!params.success) {
        result = {
            "status": params.status,
            "success": false,
            "message": params.message,
            "data": params
        };
    }
    return (result);

}