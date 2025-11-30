const express = require('express');
const router = express.Router();
const AccountsController = require('../../controllers/accounts/AccountsController');


// Search accounts with account name (GET /api/v6/accounts/search-acc?name=...)
router.get('/search-acc', AccountsController.searchWithAccount);

// Create account
// POST /api/v3_0_1/accounts/create
router.post('/create', AccountsController.createAccount);


// List accounts with filters, pagination, sorting
// GET /api/v3_0_1/accounts/list
// filters={"offset":0,"limit":10,"account_type":"Individual","sorting":[{"sort":"desc","colId":"created_at"},{"sort":"asc","colId":"name"}]}
// filter_op={}

// filters={"offset":0,"limit":10,"account_type":"Individual","sorting":[{"sort":"desc","colId":"created_at"},{"sort":"asc","colId":"name"}],"search_attr":"krish"}
// filter_op={"search_attr":"substring"}

// filters={"offset":0,"limit":10,"created_at":["2025-11-17 00:00:00","2025-11-19 23:59:59"],"account_type":"Individual","sorting":[{"sort":"desc","colId":"created_at"},{"sort":"asc","colId":"name"}]}
// filter_op={"created_at":"between"}

// filters={"offset":0,"limit":10,"created_at":["2025-11-17 00:00:00","2025-11-19 23:59:59"],"sorting":[{"sort":"desc","colId":"created_at"},{"sort":"asc","colId":"name"}],"search_attr":"agnish"}
// filter_op={"created_at":"between","search_attr":"substring"}

router.get('/list', AccountsController.listAccounts);

//// TESTING PURPOSES ONLY - Helper route to list accounts
router.get('/list_helper', AccountsController.listAccountsHelper);


// Get single account by ID
// GET /api/v3_0_1/accounts/:id
router.get('/:id', AccountsController.getAccount);


// Update account
// PUT /api/v3_0_1/accounts/:id
router.put('/:id', AccountsController.updateAccount);

// Set or Switch Primary Contact for Account
// POST /api/v3_0_1/accounts/assign_primary_contact
router.post('/assign_primary_contact', AccountsController.setPrimaryContact);

// Soft delete account 
// DELETE /api/v3_0_1/accounts/archive/:id
router.delete('/archive/:id', AccountsController.softDeleteAccount);


// Delete account (admin only)
// DELETE /api/v3_0_1/accounts/:id
router.delete('/:id', AccountsController.deleteAccount);


module.exports = router;