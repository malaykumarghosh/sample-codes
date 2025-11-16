const Sequelize = require("../../../../../database/connection");
const db = require('../../index');
const { Op } = require("sequelize");
const logger = require('../../../../logger/logger');
const { getName } = require('../../../../logger/logFunctionName');

// Define all associations
db.Organisation.hasMany(db.Account, { foreignKey: 'org_id', as: 'OrgAccountRelation' });
db.Account.belongsTo(db.Organisation, { foreignKey: 'org_id', as: 'AccountOrgRelation' });

db.Account.hasMany(db.Customer, { foreignKey: 'account_id', as: 'AccountCustomerRelation' });
db.Customer.belongsTo(db.Account, { foreignKey: 'account_id', as: 'CustomerAccRelation' });

db.Account.belongsTo(db.User, { foreignKey: 'created_by', as: 'AccountUserRelation' });
db.User.hasMany(db.Account, { foreignKey: 'created_by', as: 'UserAccountRelation' });

db.Account.hasMany(db.Invoice, { foreignKey: 'account_id', as: 'AccountInvoiceRelation' });
db.Invoice.belongsTo(db.Account, { foreignKey: 'account_id', as: 'InvoiceAccountRelation' });

exports.accountData = async (q, limit, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        // Validate and sanitize the search query
        const sanitizedQuery = q ? q.trim().replace(/_/g, '\\_') : '';
        
        if (!sanitizedQuery) {
            return { 
                success: false, 
                message: 'Search query cannot be empty', 
                status: 400 
            };
        }
        
        const accounts = await db.Account.findAll({
            where: {
                [Op.or]: [
                    { name: { [Op.like]: `%${sanitizedQuery}%` } },
                    { email: { [Op.like]: `%${sanitizedQuery}%` } },
                    { phone_number: { [Op.like]: `%${sanitizedQuery}%` } }
                ]
            },
            attributes: ['id', 'name', 'address', 'phone_number', 'email', 'city', 'state', 'country', 'postal_code'],
            include: [
                {
                    model: db.Organisation,
                    as: 'AccountOrgRelation',
                    attributes: ['name'],
                    required: false
                },
                {
                    model: db.Customer,
                    as: 'AccountCustomerRelation',
                    attributes: ['id', 'name', 'email', 'phone_number', 'address1', 'address2', 'address3'],
                    required: false
                }
            ],
            order: [['name', 'ASC']],
            limit,
            benchmark: true,
            logging: (sql, timing) => console.log('[SEQUELIZE]', sql, timing ? `${timing}ms` : '')
        });

        console.log('accounts found =', accounts.length);

        const accounts_data = accounts.map(a => ({
            id: a.id,
            name: a.name,
            address: a.address, 
            phone_number: a.phone_number, 
            email: a.email, 
            city: a.city, 
            state: a.state, 
            country: a.country, 
            postal_code: a.postal_code,
            full_address: `${a.address ? a.address + ', ' : ''}${a.city ? a.city + ', \n' : ''}${a.state ? a.state + ', ' : ''}${a.country ? a.country + ', \n' : ''}${a.postal_code ? a.postal_code : ''}`.replace(/,\s*$/, ''),
            organisation_name: a.AccountOrgRelation ? a.AccountOrgRelation.name : null,
            customers: a.AccountCustomerRelation ? a.AccountCustomerRelation.map(customer => ({
                name: customer.name,
                email: customer.email,
                phone: customer.phone_number,
                address1: customer.address1,
                address2: customer.address2,
                address3: customer.address3
            })) : []
        }));

        logger.info("*** Ending %s of %s ***", getName().functionName, getName().fileName);

        return { success: true, data: accounts_data };

    } catch (error) {
        console.log('error=>>>>>>',error);
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(error.message || JSON.stringify(error));
        return { 
            success: false, 
            message: "Failed to search accounts", 
            status: 500 
        };
    }
};

// Create Account
exports.createAccount = async (params, org_id, user_id, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        const accountData = {
            name: params.name,
            industry: params.industry || null,
            website: params.website || null,
            phone_number: params.phone_number || null,
            email: params.email || null,
            address: params.address || null,
            city: params.city || null,
            state: params.state || null,
            country: params.country || null,
            postal_code: params.postal_code || null,
            source: params.source || null,
            account_type: params.account_type || null,
            org_id: org_id,
            created_by: user_id,
            created_at: Sequelize.literal('CURRENT_TIMESTAMP')
        };

        const result = await db.Account.create(accountData);

        logger.info("*** Ending %s of %s ***", getName().functionName, getName().fileName);
        return {
            success: true,
            data: result.toJSON(),
            message: 'Account created successfully'
        };

    } catch (error) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(error.message || JSON.stringify(error));
        return { 
            success: false, 
            message: error.message || "Failed to create account", 
            status: 500 
        };
    }
};

// List Accounts
exports.listAccounts = async (params, org_id, user_id, user_type, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        logger.info("*** User type: %s ***", user_type);
        console.log("==============================Entering the function : listAccounts");
        console.log("params:", JSON.stringify(params, null, 2));

        // Build where clause based on user type
        const whereClause = { org_id };
        let userWhereArr = [];
        
        // If not admin, filter by user_id (created_by)
        if (user_type !== 'admin') {
            whereClause.created_by = user_id;
        }
        
        // Add filters if provided
        if (params.filter) {
            // Process filter keys similar to Invoice
            if (Object.keys(params.filter).length > 0) {
                let filterKeys = Object.keys(params.filter);
                let Account = db.Account.rawAttributes;
                Account = Object.keys(Account);
                
                filterKeys.forEach(filterKey => {
                    // Skip offset, limit, sorting and search_attr - handled separately
                    if (!['offset', 'limit', 'search_attr', 'sorting'].includes(filterKey)) {
                        if (Account.includes(filterKey)) {
                            whereClause[filterKey] = params.filter[filterKey];
                        }
                    }
                });
            }
            
            // Handle filter operations (like, gte, lte, between, etc.)
            if (params.filter_op) {
                if (Object.keys(params.filter_op).length > 0) {
                    let filter_op = params.filter_op;
                    let filter_op_keys = Object.keys(params.filter_op);
                    
                    filter_op_keys.forEach(filterOpKey => {
                        if (!['offset', 'limit', 'search_attr', 'sorting'].includes(filterOpKey)) {
                            // Apply operator-based filters
                            whereClause[filterOpKey] = { 
                                [Op[filter_op[filterOpKey]]]: params.filter[filterOpKey] 
                            };
                        }
                        
                        // Handle search functionality across multiple fields
                        if (filterOpKey == "search_attr") {
                            let searchStr = params.filter[filterOpKey].replace(/_/g, '\\_');
                            userWhereArr = [
                                Sequelize.where(
                                    Sequelize.literal(
                                        `CONCAT(
                                            IFNULL(LOWER(Account.name), ' '), 
                                            IFNULL(LOWER(Account.email), ' '), 
                                            IFNULL(LOWER(Account.phone_number), ' '), 
                                            IFNULL(LOWER(Account.address), ' '),
                                            IFNULL(LOWER(Account.city), ' '),
                                            IFNULL(LOWER(Account.state), ' '),
                                            IFNULL(LOWER(Account.country), ' '),
                                            IFNULL(LOWER(Account.industry), ' '),
                                            IFNULL(LOWER(Account.account_type), ' ')
                                        )`
                                    ), 
                                    {
                                        [Op[filter_op[filterOpKey]]]: searchStr.toLowerCase()
                                    }
                                )
                            ];
                        }
                    });
                }
            }
            
        }

        console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++listAccounts - whereClause:", userWhereArr, whereClause);

        // Prepare query options
        const queryOptions = {
            where: userWhereArr && userWhereArr.length > 0 
                ? { [Op.and]: [userWhereArr, whereClause] } 
                : whereClause,
            attributes: { 
                exclude: ['createdAt', 'updatedAt']
            },
            // Add includes for organization, user, customers, and invoices
            include: [
                {
                    model: db.Organisation,
                    as: 'AccountOrgRelation',
                    attributes: ['id', 'name'],
                    required: false
                },
                {
                    model: db.User,
                    as: 'AccountUserRelation',
                    attributes: ['id', 'first_name', 'last_name'],
                    required: false
                },
                {
                    model: db.Customer,
                    as: 'AccountCustomerRelation',
                    attributes: ['id', 'name', 'email', 'phone_number'],
                    where: { is_deleted: false },
                    required: false
                },
                {
                    model: db.Invoice,
                    as: 'AccountInvoiceRelation',
                    attributes: ['id', 'invoice_ref', 'invoice_type', 'billing_date', 'billing_information'],
                    required: false
                }
            ]
        };

        // Add pagination from params
        if (params.filter && params.filter.hasOwnProperty('offset') && params.filter.hasOwnProperty('limit')) {
            let offset = typeof params.filter.offset == 'string' ? parseInt(params.filter.offset) : params.filter.offset;
            let limit = typeof params.filter.limit == 'string' ? parseInt(params.filter.limit) : params.filter.limit;
            queryOptions.offset = offset;
            queryOptions.limit = Math.min(limit, 100); // Max 100
        } else if (params.offset !== undefined && params.limit !== undefined) {
            // Legacy support
            queryOptions.offset = parseInt(params.offset);
            queryOptions.limit = Math.min(parseInt(params.limit), 100); // Max 100
        }

        // Add sorting from params
        const orderArray = [];
        if (params.filter && params.filter.sorting && Array.isArray(params.filter.sorting)) {
            params.filter.sorting.forEach(sortConfig => {
                if (sortConfig.colId && sortConfig.sort) {
                    // Map colId to actual column names if needed
                    // const columnMap = {
                    //     'type': 'account_type',
                    //     'created': 'created_at',
                    //     'updated': 'updatedAt'
                    // };
                    // const column = columnMap[sortConfig.colId] || sortConfig.colId;

                    const column = sortConfig.colId;
                    const direction = sortConfig.sort.toUpperCase();
                    orderArray.push([column, direction]);
                }
            });
        }
        
        // Default sorting if none provided
        if (orderArray.length === 0) {
            orderArray.push(['created_at', 'DESC']);
        }
        
        queryOptions.order = orderArray;

        // Enable SQL logging and benchmarking for debugging
        queryOptions.benchmark = true;
        queryOptions.logging = (sql, timing) => {
            console.log('[SEQUELIZE]', sql, timing ? `${timing}ms` : '');
        };

        console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++listAccounts - queryOptions:", JSON.stringify(queryOptions, null, 2));

        const [accounts, total] = await Promise.all([
            db.Account.findAll(queryOptions),
            db.Account.count({ 
                where: userWhereArr && userWhereArr.length > 0 
                    ? { [Op.and]: [userWhereArr, whereClause] } 
                    : whereClause 
            })
        ]);

        // Process accounts to add calculated fields
        const accountsWithCalculations = accounts.map(account => {
            const accountJson = account.toJSON();
            
            // Add full address
            accountJson.full_address = [
                accountJson.address,
                accountJson.city,
                accountJson.state,
                accountJson.country,
                accountJson.postal_code
            ].filter(Boolean).join(', ');
            
            // Add customer count
            accountJson.customer_count = accountJson.AccountCustomerRelation ? accountJson.AccountCustomerRelation.length : 0;
            
            // Add invoice count
            accountJson.invoice_count = accountJson.AccountInvoiceRelation ? accountJson.AccountInvoiceRelation.length : 0;
            
            return accountJson;
        });

        logger.info("*** Ending %s of %s ***", getName().functionName, getName().fileName);
        return {
            success: true,
            data: accountsWithCalculations,
            total,
            offset: queryOptions.offset || 0,
            limit: queryOptions.limit || 10
        };

    } catch (error) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(error.message || JSON.stringify(error));
        console.error("Full error:", error);
        return { 
            success: false, 
            message: error.message || "Failed to fetch accounts", 
            status: 500 
        };
    }
};

// Get Account by ID
exports.getAccountById = async (accountId, org_id, user_type, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        const whereClause = { 
            id: accountId,
            org_id: org_id 
        };

        const account = await db.Account.findOne({
            where: whereClause,
            attributes: { 
                exclude: ['createdAt', 'updatedAt']
            },
            include: [
                {
                    model: db.Organisation,
                    as: 'AccountOrgRelation',
                    attributes: ['id', 'name'],
                    required: false
                },
                {
                    model: db.Customer,
                    as: 'AccountCustomerRelation',
                    attributes: ['id', 'name', 'email', 'phone_number'],
                    required: false
                },
                {
                    model: db.User,
                    as: 'AccountUserRelation',
                    attributes: ['id', 'first_name', 'last_name'],
                    required: false
                }
            ]
        });

        if (!account) {
            return { 
                success: false, 
                message: 'Account not found', 
                status: 404 
            };
        }

        logger.info("*** Ending %s of %s ***", getName().functionName, getName().fileName);
        return {
            success: true,
            data: account
        };

    } catch (error) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(error.message || JSON.stringify(error));
        return { 
            success: false, 
            message: error.message || "Failed to fetch account", 
            status: 500 
        };
    }
};

// Update Account
exports.updateAccount = async (accountId, params, org_id, user_id, user_type, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        const whereClause = { 
            id: accountId,
            org_id: org_id 
        };

        // If not admin, only allow updating own accounts
        if (user_type !== 'admin') {
            whereClause.created_by = user_id;
        }

        const account = await db.Account.findOne({ where: whereClause });

        if (!account) {
            return { 
                success: false, 
                message: 'Account not found or you do not have permission to update it', 
                status: 404 
            };
        }

        // Update fields
        const updateData = {};
        if (params.name !== undefined) updateData.name = params.name;
        if (params.industry !== undefined) updateData.industry = params.industry;
        if (params.website !== undefined) updateData.website = params.website;
        if (params.phone_number !== undefined) updateData.phone_number = params.phone_number;
        if (params.email !== undefined) updateData.email = params.email;
        if (params.address !== undefined) updateData.address = params.address;
        if (params.city !== undefined) updateData.city = params.city;
        if (params.state !== undefined) updateData.state = params.state;
        if (params.country !== undefined) updateData.country = params.country;
        if (params.postal_code !== undefined) updateData.postal_code = params.postal_code;
        if (params.source !== undefined) updateData.source = params.source;
        if (params.account_type !== undefined) updateData.account_type = params.account_type;

        await account.update(updateData);

        logger.info("*** Ending %s of %s ***", getName().functionName, getName().fileName);
        return {
            success: true,
            data: account.toJSON(),
            message: 'Account updated successfully'
        };

    } catch (error) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(error.message || JSON.stringify(error));
        return { 
            success: false, 
            message: error.message || "Failed to update account", 
            status: 500 
        };
    }
};

// Delete Account
exports.deleteAccount = async (accountId, org_id, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    const transaction = await Sequelize.transaction();
    
    try {
        const whereClause = { 
            id: accountId,
            org_id: org_id 
        };

        const account = await db.Account.findOne({ 
            where: whereClause,
            transaction 
        });

        if (!account) {
            await transaction.rollback();
            return { 
                success: false, 
                message: 'Account not found', 
                status: 404 
            };
        }

        // Check if account has associated customers
        const customerCount = await db.Customer.count({ 
            where: { account_id: accountId },
            transaction
        });

        if (customerCount > 0) {
            await transaction.rollback();
            return { 
                success: false, 
                message: `Cannot delete account. It has ${customerCount} associated customer(s). Please remove or reassign the customers first.`, 
                status: 400 
            };
        }

        // Check if account has associated invoices
        const invoiceCount = await db.Invoice.count({ 
            where: { account_id: accountId },
            transaction
        });

        if (invoiceCount > 0) {
            await transaction.rollback();
            return { 
                success: false, 
                message: `Cannot delete account. It has ${invoiceCount} associated invoice(s). Please remove or reassign the invoices first.`, 
                status: 400 
            };
        }

        await account.destroy({ transaction });
        await transaction.commit();

        logger.info("*** Ending %s of %s ***", getName().functionName, getName().fileName);
        return { 
            success: true, 
            message: 'Account deleted successfully' 
        };

    } catch (error) {
        await transaction.rollback();
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(error.message || JSON.stringify(error));
        return { 
            success: false, 
            message: error.message || "Failed to delete account", 
            status: 500 
        };
    }
};
