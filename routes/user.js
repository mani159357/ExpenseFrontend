const express = require('express');

const userController = require('../controller/user');
const expenseController = require('../controller/expense')

const authenticatemiddleware = require('../middleware/auth');

const router = express.Router();


router.post('/signup', userController.signup);

router.post('/login', userController.login)

router.get('/premium',userController.premiumPage)

router.get('/leadboard',authenticatemiddleware.authenticate,expenseController.leadboardPage)

router.post('/addexpense', authenticatemiddleware.authenticate, expenseController.addexpense )

router.get('/download', authenticatemiddleware.authenticate, expenseController.downloadExpenses)

router.get('/getexpenses', authenticatemiddleware.authenticate, expenseController.getexpenses )

router.delete('/deleteexpense/:expenseid', authenticatemiddleware.authenticate, expenseController.deleteexpense)

router.get('/name' , authenticatemiddleware.authenticate, expenseController.username)



module.exports = router;