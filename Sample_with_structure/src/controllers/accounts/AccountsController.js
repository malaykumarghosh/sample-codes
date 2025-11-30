const {
    createAccount,
    listAccounts,
    getAccountById,
    updateAccount,
    deleteAccount,
    softDeleteAccount,
    accountData,
    setPrimaryContact
} = require("../../models/queryModels/accounts/account");

const {
    validateCreateAccount,
    validateUpdateAccount,
    validateAccountId,
    validateSearchQuery,
    validateSearchAccount,
    sanitizeAccountData
} = require("../../helpers/accounts/accountHelper");

const logger = require('../../../logger/logger');
const { getName } = require('../../../logger/logFunctionName');



/**
 * GET /api/v6/accounts/search-acc?name=...&limit=...
 * Returns account id, name and associated organisation name where account.name having q (starts with q)
 */
exports.searchWithAccount = async (req, res, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        let currentCognitoUserDetails = req.currentUser;
        let userParams = JSON.parse(currentCognitoUserDetails['custom:user_details']);
        let user_id = userParams.user_id;
        let org_id = userParams.org_id;
        let user_type = userParams.user_type;

        // Validate query parameters using helper
        const validation = validateSearchQuery({
            name: req.query.name,
            limit: req.query.limit,
            deleted_flag: req.query.deleted_flag
        });
        
        if (!validation.success) {
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return res.status(validation.status).json({ 
                success: false, 
                message: validation.message 
            });
        }

        const { name: q, limit, deleted_flag } = validation.data;

        const result = await accountData(q, org_id, user_id, user_type, limit, deleted_flag, next);
        
        if (!result.success) {
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return res.status(result.status || 400).json({ 
                success: false, 
                message: result.message 
            });
        }

        logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
        return res.json({ 
            success: true, 
            data: result.data 
        });
        
    } catch (err) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(err.message || JSON.stringify(err));
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to search accounts', 
            details: err.message 
        });
    }
};

// Create account
exports.createAccount = async (req, res, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        let currentCognitoUserDetails = req.currentUser;
        let userParams = JSON.parse(currentCognitoUserDetails['custom:user_details']);
        let user_id = userParams.user_id;
        let org_id = userParams.org_id;

        // Validate request body using helper
        const validation = validateCreateAccount(req.body);
        if (!validation.success) {
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return res.status(validation.status).json({ 
                success: false, 
                message: validation.message 
            });
        }

        // Sanitize data
        const sanitized = sanitizeAccountData(validation.data);
        if (!sanitized.success) {
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return res.status(sanitized.status).json({ 
                success: false, 
                message: sanitized.message 
            });
        }

        const accountData = await createAccount(sanitized.data, org_id, user_id, next);
        
        if (!accountData.success) {
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return res.status(accountData.status || 400).json({ 
                success: false, 
                message: accountData.message || 'Failed to create account' 
            });
        }

        logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
        return res.status(201).json({ 
            success: true, 
            message: accountData.message || 'Account created successfully', 
            data: accountData.data 
        });

    } catch (error) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(error.message || JSON.stringify(error));
        return res.status(500).json({ 
            success: false, 
            message: "Something went wrong" 
        });
    }
};

// List accounts
exports.listAccounts = async (req, res, next) => {
    console.log("****************************************************Entered listAccounts controller");
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        const currentCognitoUserDetails = req.currentUser;
        let userParams = JSON.parse(currentCognitoUserDetails['custom:user_details']);
        let org_id = userParams.org_id;
        let user_id = userParams.user_id;
        let user_type = userParams.user_type;
        
        let params = {};
        
        // Support query string parameters (filter and filter_op separately)
        if (req.query.filters || req.query.filter_op) {
            try {
                if (req.query.filters) {
                    params.filter = JSON.parse(req.query.filters);
                }
                if (req.query.filter_op) {
                    params.filter_op = JSON.parse(req.query.filter_op);
                }
            } catch (e) {
                logger.error("Failed to parse filter/filter_op: %s", e.message);
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid filter/filter_op format' 
                });
            }
        } else if (req.body && Object.keys(req.body).length > 0) {
            // Support body params
            params = req.body;
        }
        
        const accountData = await listAccounts(params, org_id, user_id, user_type, next);
        
        if (!accountData.success) {
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return res.status(accountData.status || 400).json({ 
                success: false, 
                message: accountData.message || 'Failed to fetch accounts' 
            });
        }

        logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
        return res.json({ 
            success: true, 
            total: accountData.total || 0, 
            data: accountData.data 
        });

    } catch (error) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(error.message || JSON.stringify(error));
        return res.status(500).json({ 
            success: false, 
            message: "Something went wrong" 
        });
    }
};

// List accounts with helper validation
exports.listAccountsHelper = async (req, res, next) => {
    console.log("****************************************************Entered listAccountsHelper controller");
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        const currentCognitoUserDetails = req.currentUser;
        let userParams = JSON.parse(currentCognitoUserDetails['custom:user_details']);
        let org_id = userParams.org_id;
        let user_id = userParams.user_id;
        let user_type = userParams.user_type;
        
        // Validate request using helper
        const validation = await validateSearchAccount(req.query);
        
        if (!validation.success) {
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return res.status(validation.status || 400).json({ 
                success: false, 
                message: validation.message 
            });
        }

        const params = validation.data;
        
        const accountData = await listAccounts(params, org_id, user_id, user_type, next);
        
        if (!accountData.success) {
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return res.status(accountData.status || 400).json({ 
                success: false, 
                message: accountData.message || 'Failed to fetch accounts' 
            });
        }

        logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
        return res.json({ 
            success: true, 
            total: accountData.total || 0, 
            data: accountData.data 
        });

    } catch (error) {
        console.error('Stack trace:', error.stack);
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(error.message || JSON.stringify(error));
        return res.status(500).json({ 
            success: false, 
            message: "Something went wrong" 
        });
    }
};

// Get single account by ID
exports.getAccount = async (req, res, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        const currentCognitoUserDetails = req.currentUser;
        let userParams = JSON.parse(currentCognitoUserDetails['custom:user_details']);
        let org_id = userParams.org_id;
        let user_type = userParams.user_type;
        
        // Validate account ID using helper
        const validation = validateAccountId(req.params);
        if (!validation.success) {
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return res.status(validation.status).json({ 
                success: false, 
                message: validation.message 
            });
        }

        const accountId = validation.data.id;

        const accountData = await getAccountById(accountId, org_id, user_type, next);
        
        if (!accountData.success) {
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return res.status(accountData.status || 404).json({ 
                success: false, 
                message: accountData.message || 'Account not found' 
            });
        }

        logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
        return res.json({ 
            success: true, 
            data: accountData.data 
        });

    } catch (error) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(error.message || JSON.stringify(error));
        return res.status(500).json({ 
            success: false, 
            message: "Something went wrong" 
        });
    }
};

// Update account
exports.updateAccount = async (req, res, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        const currentCognitoUserDetails = req.currentUser;
        let userParams = JSON.parse(currentCognitoUserDetails['custom:user_details']);
        let org_id = userParams.org_id;
        let user_id = userParams.user_id;
        let user_type = userParams.user_type;
        
        // Validate account ID using helper
        const idValidation = validateAccountId(req.params);
        if (!idValidation.success) {
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return res.status(idValidation.status).json({ 
                success: false, 
                message: idValidation.message 
            });
        }

        const accountId = idValidation.data.id;

        // Validate request body using helper
        const validation = validateUpdateAccount(req.body);
        if (!validation.success) {
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return res.status(validation.status).json({ 
                success: false, 
                message: validation.message 
            });
        }

        // Sanitize data
        const sanitized = sanitizeAccountData(validation.data);
        if (!sanitized.success) {
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return res.status(sanitized.status).json({ 
                success: false, 
                message: sanitized.message 
            });
        }

        const accountData = await updateAccount(accountId, sanitized.data, org_id, user_id, user_type, next);
        
        if (!accountData.success) {
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return res.status(accountData.status || 400).json({ 
                success: false, 
                message: accountData.message || 'Failed to update account' 
            });
        }

        logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
        return res.json({ 
            success: true, 
            message: accountData.message || 'Account updated successfully', 
            data: accountData.data 
        });

    } catch (error) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(error.message || JSON.stringify(error));
        return res.status(500).json({ 
            success: false, 
            message: "Something went wrong" 
        });
    }
};

// Delete account
exports.deleteAccount = async (req, res, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        const currentCognitoUserDetails = req.currentUser;
        let userParams = JSON.parse(currentCognitoUserDetails['custom:user_details']);
        let org_id = userParams.org_id;
        let user_type = userParams.user_type;
        
        // Validate account ID using helper
        const validation = validateAccountId(req.params);
        if (!validation.success) {
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return res.status(validation.status).json({ 
                success: false, 
                message: validation.message 
            });
        }

        const accountId = validation.data.id;

        // Only admin can delete accounts
        if (user_type !== 'admin') {
            logger.error("*** Insufficient permissions to delete account in %s of %s ***", getName().functionName, getName().fileName);
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return res.status(403).json({ 
                success: false, 
                message: 'Insufficient permissions to delete account' 
            });
        }

        const accountData = await deleteAccount(accountId, org_id, next);
        
        if (!accountData.success) {
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return res.status(accountData.status || 400).json({ 
                success: false, 
                message: accountData.message || 'Failed to delete account' 
            });
        }

        logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
        return res.json({ 
            success: true, 
            message: accountData.message || 'Account deleted successfully' 
        });

    } catch (error) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(error.message || JSON.stringify(error));
        return res.status(500).json({ 
            success: false, 
            message: "Something went wrong" 
        });
    }
};

// Soft delete account
exports.softDeleteAccount = async (req, res, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        const currentCognitoUserDetails = req.currentUser;
        let userParams = JSON.parse(currentCognitoUserDetails['custom:user_details']);
        let org_id = userParams.org_id;
        let user_id = userParams.user_id;
        
        // Validate account ID using helper
        const validation = validateAccountId(req.params);
        if (!validation.success) {
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return res.status(validation.status).json({ 
                success: false, 
                message: validation.message 
            });
        }

        const accountId = validation.data.id;

        const accountData = await softDeleteAccount(accountId, org_id, user_id, next);
        
        if (!accountData.success) {
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return res.status(accountData.status || 400).json({ 
                success: false, 
                message: accountData.message || 'Failed to soft delete account' 
            });
        }

        logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
        return res.json({ 
            success: true, 
            message: accountData.message || 'Account soft deleted successfully',
            data: accountData.data
        });

    } catch (error) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(error.message || JSON.stringify(error));
        return res.status(500).json({ 
            success: false, 
            message: "Something went wrong" 
        });
    }
};

// Set primary contact for account
exports.setPrimaryContact = async (req, res, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        const currentCognitoUserDetails = req.currentUser;
        let userParams = JSON.parse(currentCognitoUserDetails['custom:user_details']);
        let org_id = userParams.org_id;
        let user_id = userParams.user_id;
        
        // Validate required fields
        const { account_id, customer_id } = req.body;
        
        if (!account_id || !customer_id) {
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return res.status(400).json({ 
                success: false, 
                message: 'account_id and customer_id are required' 
            });
        }

        const result = await setPrimaryContact({ account_id, customer_id }, org_id, user_id, next);
        
        if (!result.success) {
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return res.status(result.status || 400).json({ 
                success: false, 
                message: result.message || 'Failed to set primary contact' 
            });
        }

        logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
        return res.json({ 
            success: true, 
            message: result.message || 'Primary contact set successfully',
            data: result.data
        });

    } catch (error) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(error.message || JSON.stringify(error));
        return res.status(500).json({ 
            success: false, 
            message: "Something went wrong" 
        });
    }
};
