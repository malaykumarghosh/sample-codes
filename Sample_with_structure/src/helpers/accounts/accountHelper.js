const Joi = require("joi");
const { checkOpKeys } = require('../common/searchOpKeys');
const logger = require('../../../logger/logger');
const { getName } = require('../../../logger/logFunctionName');

/**
 * Validation schema for creating a new account
 */
const createAccountSchema = Joi.object({
    name: Joi.string().max(255).required()
        .messages({
            'string.empty': 'Account name is required',
            'string.max': 'Account name cannot exceed 255 characters',
            'any.required': 'Account name is required'
        }),
    industry: Joi.string().max(100).allow(null, '').optional(),
    website: Joi.string().max(255).uri().allow(null, '').optional()
        .messages({
            'string.uri': 'Website must be a valid URL'
        }),
    phone_number: Joi.string().max(20).pattern(/^[0-9+\-\s()]+$/).allow(null, '').optional()
        .messages({
            'string.pattern.base': 'Phone number must contain only digits, +, -, spaces, and parentheses'
        }),
    email: Joi.string().max(100).email().allow(null, '').optional()
        .messages({
            'string.email': 'Email must be a valid email address'
        }),
    address: Joi.string().allow(null, '').optional(),
    city: Joi.string().max(100).allow(null, '').optional(),
    state: Joi.string().max(100).allow(null, '').optional(),
    country: Joi.string().max(100).allow(null, '').optional(),
    postal_code: Joi.string().max(20).allow(null, '').optional(),
    source: Joi.string().max(100).allow(null, '').optional(),
    created_by: Joi.number().integer().positive().allow(null).optional(),
    org_id: Joi.number().integer().positive().allow(null).optional(),
    account_type: Joi.string().max(100).allow(null, '').optional(),
    customer_id: Joi.number().integer().positive().allow(null).optional()
        .messages({
            'number.base': 'Customer ID must be a number',
            'number.positive': 'Customer ID must be a positive number'
        })
});

/**
 * Validation schema for updating an existing account
 */
const updateAccountSchema = Joi.object({
    name: Joi.string().max(255).optional()
        .messages({
            'string.max': 'Account name cannot exceed 255 characters'
        }),
    industry: Joi.string().max(100).allow(null, '').optional(),
    website: Joi.string().max(255).uri().allow(null, '').optional()
        .messages({
            'string.uri': 'Website must be a valid URL'
        }),
    phone_number: Joi.string().max(20).pattern(/^[0-9+\-\s()]+$/).allow(null, '').optional()
        .messages({
            'string.pattern.base': 'Phone number must contain only digits, +, -, spaces, and parentheses'
        }),
    email: Joi.string().max(100).email().allow(null, '').optional()
        .messages({
            'string.email': 'Email must be a valid email address'
        }),
    address: Joi.string().allow(null, '').optional(),
    city: Joi.string().max(100).allow(null, '').optional(),
    state: Joi.string().max(100).allow(null, '').optional(),
    country: Joi.string().max(100).allow(null, '').optional(),
    postal_code: Joi.string().max(20).allow(null, '').optional(),
    source: Joi.string().max(100).allow(null, '').optional(),
    org_id: Joi.number().integer().positive().allow(null).optional(),
    account_type: Joi.string().max(100).allow(null, '').optional()
}).min(1);

/**
 * Validation schema for account ID parameter
 */
const accountIdSchema = Joi.object({
    id: Joi.number().integer().positive().required()
        .messages({
            'number.base': 'Account ID must be a number',
            'number.positive': 'Account ID must be a positive number',
            'any.required': 'Account ID is required'
        })
});

/**
 * Validation schema for search query parameters (used by searchWithAccount endpoint)
 */
const searchQuerySchema = Joi.object({
    name: Joi.string().min(1).max(255).required()
        .messages({
            'string.empty': 'Search query cannot be empty',
            'string.min': 'Search query must be at least 1 character',
            'string.max': 'Search query cannot exceed 255 characters',
            'any.required': 'Search query is required'
        }),
    limit: Joi.number().integer().min(1).max(100).default(50)
        .messages({
            'number.base': 'Limit must be a number',
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100'
        }),
    deleted_flag: Joi.allow(null).optional()    
});

/**
 * Validation schema for search/filter parameters
 */
const searchAccountSchema = Joi.object({
    name: Joi.alternatives().try(
        Joi.string().max(255),
        Joi.object().pattern(Joi.string(), Joi.any())
    ).optional(),
    industry: Joi.alternatives().try(
        Joi.string().max(100),
        Joi.object().pattern(Joi.string(), Joi.any())
    ).optional(),
    city: Joi.alternatives().try(
        Joi.string().max(100),
        Joi.object().pattern(Joi.string(), Joi.any())
    ).optional(),
    state: Joi.alternatives().try(
        Joi.string().max(100),
        Joi.object().pattern(Joi.string(), Joi.any())
    ).optional(),
    country: Joi.alternatives().try(
        Joi.string().max(100),
        Joi.object().pattern(Joi.string(), Joi.any())
    ).optional(),
    account_type: Joi.alternatives().try(
        Joi.string().max(100),
        Joi.object().pattern(Joi.string(), Joi.any())
    ).optional(),
    org_id: Joi.alternatives().try(
        Joi.number().integer(),
        Joi.object().pattern(Joi.string(), Joi.any())
    ).optional(),
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    sort: Joi.string().optional(),
    order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC').optional()
}).unknown(true);

/**
 * Validate create account request
 * @param {Object} data - Request body data
 * @returns {Object} - Validation result
 */
const validateCreateAccount = (data) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    
    try {
        const { error, value } = createAccountSchema.validate(data, { 
            abortEarly: false,
            stripUnknown: true 
        });
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            logger.error(`*** ${JSON.stringify(errors)} in %s of %s ***`, getName().functionName, getName().fileName);
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return { status: 400, success: false, message: errors };
        }
        
        logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
        return { status: 200, success: true, data: value };
    } catch (err) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(err.message || JSON.stringify(err));
        return { status: 500, success: false, message: "Something went wrong" };
    }
};

/**
 * Validate update account request
 * @param {Object} data - Request body data
 * @returns {Object} - Validation result
 */
const validateUpdateAccount = (data) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    
    try {
        const { error, value } = updateAccountSchema.validate(data, { 
            abortEarly: false,
            stripUnknown: true 
        });
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            logger.error(`*** ${JSON.stringify(errors)} in %s of %s ***`, getName().functionName, getName().fileName);
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return { status: 400, success: false, message: errors };
        }
        
        logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
        return { status: 200, success: true, data: value };
    } catch (err) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(err.message || JSON.stringify(err));
        return { status: 500, success: false, message: "Something went wrong" };
    }
};

/**
 * Validate account ID parameter
 * @param {Object} params - Request params
 * @returns {Object} - Validation result
 */
const validateAccountId = (params) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    
    try {
        const { error, value } = accountIdSchema.validate(params, { 
            abortEarly: false 
        });
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            logger.error(`*** ${JSON.stringify(errors)} in %s of %s ***`, getName().functionName, getName().fileName);
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return { status: 400, success: false, message: errors };
        }
        
        logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
        return { status: 200, success: true, data: value };
    } catch (err) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(err.message || JSON.stringify(err));
        return { status: 500, success: false, message: "Something went wrong" };
    }
};

/**
 * Validate search query parameters (for searchWithAccount endpoint)
 * @param {Object} query - Request query parameters
 * @returns {Object} - Validation result
 */
const validateSearchQuery = (query) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    
    try {
        const { error, value } = searchQuerySchema.validate(query, { 
            abortEarly: false 
        });
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            logger.error(`*** ${JSON.stringify(errors)} in %s of %s ***`, getName().functionName, getName().fileName);
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return { status: 400, success: false, message: errors };
        }
        
        logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
        return { status: 200, success: true, data: value };
    } catch (err) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(err.message || JSON.stringify(err));
        return { status: 500, success: false, message: "Something went wrong" };
    }
};

/**
 * Validate search/filter parameters
 * @param {Object} query - Request query parameters
 * @returns {Object} - Validation result
 */
const validateSearchAccount = async (query) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    
    try {
        let filters = query.filters || null;
        let filter_op = query.filter_op || null;
        let result = {};
        let data_hash = {};
        
        // Parse filters if provided
        if (filters) {
            let filters_obj = JSON.parse(filters);
            let filter_arr = Object.keys(filters_obj);
            let filter = {};
            filter_arr.forEach(e => {
                filter[e] = filters_obj[e];
            });
            if (Object.keys(filter).length > 0) {
                data_hash["filter"] = filter;
            }
        }
        
        // Parse and validate filter_op if provided
        if (filter_op) {
            let filter_op_obj = JSON.parse(filter_op);
            var isPassedOpKeys = await checkOpKeys(Object.values(filter_op_obj));
            if (!isPassedOpKeys.success) {
                result = {
                    "success": false,
                    "message": isPassedOpKeys.message
                };
                logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
                return { status: 400, success: false, message: isPassedOpKeys.message };
            }
            if (Object.keys(filter_op_obj).length > 0) {
                data_hash["filter_op"] = filter_op_obj;
            }
        }
        
        // Add other query parameters to data_hash
        if (query.page) data_hash["page"] = query.page;
        if (query.limit) data_hash["limit"] = query.limit;
        if (query.sort) data_hash["sort"] = query.sort;
        if (query.order) data_hash["order"] = query.order;
        
        // Validate with schema if filter exists
        if (data_hash?.filter && Object.keys(data_hash?.filter).length > 0) {
            const { error, value } = searchAccountSchema.validate(data_hash.filter, { 
            abortEarly: false,
            stripUnknown: false 
        });
        
        if (error) {
                logger.error(`*** ${error.details[0].message} in %s of %s ***`, getName().functionName, getName().fileName);
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
                return { status: 400, success: false, message: error.details[0].message };
        }
        }
        
        result = {
            "success": true,
            "data": data_hash
        };
        logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
        return result;
    } catch (err) {
        console.error('Stack trace:', err.stack);
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(err.message || JSON.stringify(err));
        return { status: 500, success: false, message: "Something went wrong" };
    }
};

/**
 * Sanitize account data before saving
 * @param {Object} data - Account data
 * @returns {Object} - Sanitized data
 */
const sanitizeAccountData = (data) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    
    try {
        const sanitized = { ...data };
        
        // Trim string fields
        const stringFields = ['name', 'industry', 'website', 'phone_number', 'email', 
                              'address', 'city', 'state', 'country', 'postal_code', 
                              'source', 'account_type'];
        
        stringFields.forEach(field => {
            if (sanitized[field] && typeof sanitized[field] === 'string') {
                sanitized[field] = sanitized[field].trim();
                // Convert empty strings to null
                if (sanitized[field] === '') {
                    sanitized[field] = null;
                }
            }
        });
        
        logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
        return { status: 200, success: true, data: sanitized };
    } catch (err) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(err.message || JSON.stringify(err));
        return { status: 500, success: false, message: "Something went wrong" };
    }
};

module.exports = {
    validateCreateAccount,
    validateUpdateAccount,
    validateAccountId,
    validateSearchQuery,
    validateSearchAccount,
    sanitizeAccountData,
    createAccountSchema,
    updateAccountSchema,
    accountIdSchema,
    searchQuerySchema,
    searchAccountSchema
};