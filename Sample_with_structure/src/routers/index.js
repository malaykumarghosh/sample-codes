const express = require('express');
const router = express.Router();

const userRouter = require('./users/userRouter');
const { authenticate } = require('../../universal/controllers/middlewares/middlewareController');


const accountRouter = require('./accounts/accountRouter'); 
const invoiceRouter = require('./invoices/invoiceRouter');
const paymentRouter = require('./payments/paymentRouter');


router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Session');
    res.header('Access-Control-Allow-Headers', 'Authorization');
    res.header('Access-Control-Allow-Headers', 'Accesstoken');
    res.header('Access-Control-Allow-Headers', 'language');
    res.header('Access-Control-Allow-Headers', 'qlanguage');
    res.header('Access-Control-Allow-Headers', 'business_details');
    next();
});

router.use('/users', userRouter);


router.use('/accounts', authenticate, accountRouter);
router.use('/invoices', authenticate, invoiceRouter); 
router.use('/payments', authenticate, paymentRouter);

router.get('*', (req, res) => {
 res.status(404).send('v2: Not Found');
});

module.exports = router;