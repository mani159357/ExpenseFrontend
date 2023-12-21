const path = require('path');
const fs = require('fs');
const express = require('express');
var cors = require('cors')
const compression = require('compression');
const morgan = require('morgan')

const sequelize = require('./util/database');
const User = require('./models/users');
const Expense = require('./models/expenses');
const Order = require('./models/orders');
const Forgotpassword = require('./models/forgotpassword');

const userRoutes = require('./routes/user')
const purchaseRoutes = require('./routes/purchase')
const resetPasswordRoutes = require('./routes/resetpassword')

const app = express();
const dotenv = require('dotenv');
dotenv.config();
const accessLogServices = fs.createWriteStream(path.join(__dirname,'access.log'),{flags: 'a'});

app.use(cors());
app.use(compression())
app.use(morgan('combined',{stream: accessLogServices}));
app.use(express.json());  //this is for handling jsons
// app.use(express.static('views'))

app.use('/user', userRoutes)
app.use('/purchase', purchaseRoutes)
app.use('/password', resetPasswordRoutes);

app.use((req,res) => {
    res.sendFile(path.join(__dirname,`views/${req.url}`))
})

User.hasMany(Expense);
Expense.belongsTo(User);

User.hasMany(Order);
Order.belongsTo(User);

User.hasMany(Forgotpassword);
Forgotpassword.belongsTo(User);

sequelize.sync()
    .then(() => {
        console.log("server running on port  3000")
        app.listen(process.env.PORT || 3000);
    })
    .catch(err => {
        console.log(err);
    })