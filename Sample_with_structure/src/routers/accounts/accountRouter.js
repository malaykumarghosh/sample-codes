const express = require('express');
const router = express.Router();
const AccountsController = require('../../controllers/accounts/AccountsController');

/**
 * @route   GET /api/v3_0_1/accounts/search-acc
 * @desc    Search accounts by name (autocomplete/typeahead search)
 * @query   {string} name - Search term (required, min 1 char, max 255 chars)
 * @query   {number} limit - Maximum number of results (optional, default 50, max 100)
 * @access  Private (requires authentication)
 * @returns {Object} { success: true, data: [{ id, name, email, phone_number, full_address, organisation_name, customers }] }
 * @example GET /api/v3_0_1/accounts/search-acc?name=Acme&limit=10
 */
router.get('/search-acc', AccountsController.searchWithAccount);

/**
 * @route   GET /api/v3_0_1/accounts/list
 * @desc    List accounts with advanced filters, pagination, sorting, and multi-field search
 * 
 * @query   {string} filters - JSON string containing filter parameters (optional)
 * @query   {string} filter_op - JSON string containing operator mappings for filters (optional)
 * 
 * SUPPORTED OPERATORS (via filter_op):
 * - substring/like: Contains search (case-insensitive)
 * - startsWith: Starts with search
 * - endsWith: Ends with search
 * - eq/equals: Exact match
 * - ne/notEquals: Not equal
 * - gt: Greater than
 * - gte: Greater than or equal
 * - lt: Less than
 * - lte: Less than or equal
 * - between: Range search (requires array [min, max])
 * - in: Match any in array
 * - notIn: Match none in array
 * - isNull: Field is NULL
 * - isNotNull: Field is NOT NULL
 * 
 * FILTERS STRUCTURE:
 * {
 *   "offset": 0,                              // Starting record (default: 0)
 *   "limit": 10,                              // Records per page (default: 10, max: 100)
 *   "search_attr": "search_term",             // Multi-field search (searches across 9 fields)
 *   "sorting": [                              // Sorting configuration
 *     {"colId": "created_at", "sort": "desc"}
 *   ],
 *   "account_type": "individual",             // Direct field filter (equality)
 *   "created_at": ["2025-11-11", "2025-11-11"] // Date range (requires filter_op with "between")
 * }
 * 
 * FILTER_OP STRUCTURE:
 * {
 *   "search_attr": "substring",               // Operator for search_attr
 *   "created_at": "between",                  // Operator for created_at
 *   "account_type": "eq"                      // Operator for account_type
 * }
 * 
 * MULTI-FIELD SEARCH (search_attr):
 * Searches across: name, email, phone_number, address, city, state, country, industry, account_type
 * 
 * FILTERABLE FIELDS:
 * - name, email, phone_number, address, city, state, country, postal_code
 * - industry, website, source, account_type
 * - created_at, created_by, org_id
 * 
 * SORTABLE FIELDS (via sorting[].colId):
 * - name, email, phone_number, created_at, account_type, industry, city, state, country
 * 
 * @access  Private (requires authentication)
 * @returns {Object} { success: true, total: number, offset: number, limit: number, data: [...] }
 * 
 * @example Example 1: Multi-field search with substring operator
 * GET /api/v3_0_1/accounts/list?filter_op={"search_attr":"substring"}&filters={"offset":0,"limit":10,"search_attr":"Acme"}
 * 
 * @example Example 2: Date range filter
 * GET /api/v3_0_1/accounts/list?filter_op={"created_at":"between"}&filters={"offset":0,"limit":10,"created_at":["2025-11-11","2025-11-16"]}
 * 
 * @example Example 3: Combined search and date range
 * GET /api/v3_0_1/accounts/list?filter_op={"created_at":"between","search_attr":"substring"}&filters={"offset":0,"limit":10,"created_at":["2025-11-11","2025-11-16"],"search_attr":"Indus"}
 * 
 * @example Example 4: Filter by account type with sorting
 * GET /api/v3_0_1/accounts/list?filters={"offset":0,"limit":10,"sorting":[{"sort":"desc","colId":"created_at"}],"account_type":"individual"}
 * 
 * @example Example 5: Complex filtering with multiple operators
 * GET /api/v3_0_1/accounts/list?filter_op={"name":"startsWith","industry":"eq"}&filters={"offset":0,"limit":20,"name":"Acme","industry":"Technology"}
 * 
 * @example Example 6: Greater than filter for created_at
 * GET /api/v3_0_1/accounts/list?filter_op={"created_at":"gte"}&filters={"offset":0,"limit":10,"created_at":"2025-11-01"}
 * 
 * @example Example 7: IN operator for multiple account types
 * GET /api/v3_0_1/accounts/list?filter_op={"account_type":"in"}&filters={"offset":0,"limit":10,"account_type":["individual","corporate"]}
 * 
 * @example Example 8: Legacy pagination support (without filters object)
 * GET /api/v3_0_1/accounts/list?offset=0&limit=10
 * 
 * RESPONSE FORMAT:
 * {
 *   "success": true,
 *   "total": 150,
 *   "offset": 0,
 *   "limit": 10,
 *   "data": [
 *     {
 *       "id": 1,
 *       "name": "Acme Corp",
 *       "email": "info@acme.com",
 *       "phone_number": "+1234567890",
 *       "address": "123 Main St",
 *       "city": "New York",
 *       "state": "NY",
 *       "country": "USA",
 *       "postal_code": "10001",
 *       "industry": "Technology",
 *       "website": "https://acme.com",
 *       "account_type": "corporate",
 *       "source": "Website",
 *       "org_id": 1,
 *       "created_by": 5,
 *       "created_at": "2025-11-16T10:30:00.000Z",
 *       "full_address": "123 Main St, New York, NY, USA, 10001",
 *       "customer_count": 5,
 *       "invoice_count": 12,
 *       "AccountOrgRelation": {
 *         "id": 1,
 *         "name": "My Organization"
 *       },
 *       "AccountUserRelation": {
 *         "id": 5,
 *         "first_name": "John",
 *         "last_name": "Doe"
 *       },
 *       "AccountCustomerRelation": [...],
 *       "AccountInvoiceRelation": [...]
 *     }
 *   ]
 * }
 * 
 * NOTES:
 * - All filters validate against Account model's rawAttributes (prevents SQL injection)
 * - search_attr uses CONCAT for efficient multi-field search with single SQL LIKE query
 * - Date filters require proper ISO format: YYYY-MM-DD or full ISO8601
 * - Underscore characters in search terms are automatically escaped
 * - Maximum limit is capped at 100 records per request
 * - Non-admin users can only see accounts they created (created_by filter auto-applied)
 * - All searches are case-insensitive
 * - NULL values in concatenated search are handled with IFNULL()
 */
router.get('/list', AccountsController.listAccounts);

/**
 * @route   GET /api/v3_0_1/accounts/:id
 * @desc    Get single account by ID with related data (organisation, customers, user)
 * @param   {number} id - Account ID (required, must be positive integer)
 * @access  Private (requires authentication, org_id match)
 * @returns {Object} { success: true, data: { id, name, ..., AccountOrgRelation, AccountCustomerRelation } }
 * @example GET /api/v3_0_1/accounts/123
 * 
 * RESPONSE FORMAT:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 123,
 *     "name": "Acme Corp",
 *     "email": "info@acme.com",
 *     "phone_number": "+1234567890",
 *     "address": "123 Main St",
 *     "city": "New York",
 *     "state": "NY",
 *     "country": "USA",
 *     "postal_code": "10001",
 *     "industry": "Technology",
 *     "website": "https://acme.com",
 *     "account_type": "corporate",
 *     "source": "Website",
 *     "org_id": 1,
 *     "created_by": 5,
 *     "created_at": "2025-11-16T10:30:00.000Z",
 *     "AccountOrgRelation": {
 *       "id": 1,
 *       "name": "My Organization"
 *     },
 *     "AccountUserRelation": {
 *       "id": 5,
 *       "first_name": "John",
 *       "last_name": "Doe"
 *     },
 *     "AccountCustomerRelation": [
 *       {
 *         "id": 1,
 *         "name": "Customer A",
 *         "email": "customer@example.com",
 *         "phone_number": "+1987654321"
 *       }
 *     ]
 *   }
 * }
 */
router.get('/:id', AccountsController.getAccount);

/**
 * @route   POST /api/v3_0_1/accounts/create
 * @desc    Create a new account
 * @body    {Object} Account data
 * @body    {string} name - Account name (required, max 255 chars)
 * @body    {string} industry - Industry (optional, max 100 chars)
 * @body    {string} website - Website URL (optional, max 255 chars, must be valid URL)
 * @body    {string} phone_number - Phone number (optional, max 20 chars, format: digits, +, -, spaces, ())
 * @body    {string} email - Email address (optional, max 100 chars, must be valid email)
 * @body    {string} address - Street address (optional)
 * @body    {string} city - City (optional, max 100 chars)
 * @body    {string} state - State/Province (optional, max 100 chars)
 * @body    {string} country - Country (optional, max 100 chars)
 * @body    {string} postal_code - Postal/ZIP code (optional, max 20 chars)
 * @body    {string} source - Lead source (optional, max 100 chars)
 * @body    {string} account_type - Account type (optional, max 100 chars)
 * @access  Private (requires authentication)
 * @returns {Object} { success: true, message: 'Account created successfully', data: {...} }
 * 
 * @example POST /api/v3_0_1/accounts/create
 * Content-Type: application/json
 * Body: 
 * {
 *   "name": "Acme Corp",
 *   "industry": "Technology",
 *   "email": "info@acme.com",
 *   "phone_number": "+1234567890",
 *   "website": "https://acme.com",
 *   "address": "123 Main St",
 *   "city": "New York",
 *   "state": "NY",
 *   "country": "USA",
 *   "postal_code": "10001",
 *   "account_type": "corporate",
 *   "source": "Website"
 * }
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "message": "Account created successfully",
 *   "data": {
 *     "id": 124,
 *     "name": "Acme Corp",
 *     "industry": "Technology",
 *     ...
 *   }
 * }
 */
router.post('/create', AccountsController.createAccount);

/**
 * @route   PUT /api/v3_0_1/accounts/:id
 * @desc    Update an existing account
 * @param   {number} id - Account ID (required, must be positive integer)
 * @body    {Object} Account data (at least one field required)
 * @body    {string} name - Account name (optional, max 255 chars)
 * @body    {string} industry - Industry (optional, max 100 chars)
 * @body    {string} website - Website URL (optional, max 255 chars, must be valid URL)
 * @body    {string} phone_number - Phone number (optional, max 20 chars)
 * @body    {string} email - Email address (optional, max 100 chars, must be valid email)
 * @body    {string} address - Street address (optional)
 * @body    {string} city - City (optional, max 100 chars)
 * @body    {string} state - State/Province (optional, max 100 chars)
 * @body    {string} country - Country (optional, max 100 chars)
 * @body    {string} postal_code - Postal/ZIP code (optional, max 20 chars)
 * @body    {string} source - Lead source (optional, max 100 chars)
 * @body    {string} account_type - Account type (optional, max 100 chars)
 * @access  Private (requires authentication, org_id match, admin or creator only)
 * @returns {Object} { success: true, message: 'Account updated successfully', data: {...} }
 * 
 * @example PUT /api/v3_0_1/accounts/123
 * Content-Type: application/json
 * Body: 
 * {
 *   "name": "Acme Corporation",
 *   "website": "https://acmecorp.com"
 * }
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "message": "Account updated successfully",
 *   "data": {
 *     "id": 123,
 *     "name": "Acme Corporation",
 *     "website": "https://acmecorp.com",
 *     ...
 *   }
 * }
 * 
 * AUTHORIZATION:
 * - Admin users can update any account in their organization
 * - Non-admin users can only update accounts they created
 */
router.put('/:id', AccountsController.updateAccount);

/**
 * @route   DELETE /api/v3_0_1/accounts/:id
 * @desc    Delete an account (only if no associated customers or invoices)
 * @param   {number} id - Account ID (required, must be positive integer)
 * @access  Private (requires authentication, admin only)
 * @returns {Object} { success: true, message: 'Account deleted successfully' }
 * 
 * @error   {400} Cannot delete account with associated customers or invoices
 * @error   {403} Insufficient permissions (non-admin users)
 * @error   {404} Account not found
 * 
 * @example DELETE /api/v3_0_1/accounts/123
 * 
 * SUCCESS RESPONSE:
 * {
 *   "success": true,
 *   "message": "Account deleted successfully"
 * }
 * 
 * ERROR RESPONSE (Has Dependencies):
 * {
 *   "success": false,
 *   "message": "Cannot delete account. It has 5 associated customer(s). Please remove or reassign the customers first."
 * }
 * 
 * ERROR RESPONSE (Unauthorized):
 * {
 *   "success": false,
 *   "message": "Insufficient permissions to delete account"
 * }
 * 
 * NOTES:
 * - Uses database transaction for atomic operations
 * - Checks for associated customers before deletion
 * - Checks for associated invoices before deletion
 * - Only admin users can delete accounts
 * - Account must belong to the same organization as the user
 */
router.delete('/:id', AccountsController.deleteAccount);

module.exports = router;