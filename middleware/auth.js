const jwt = require('jsonwebtoken');
const User = require('../models/users');

const authenticate = async(req, res, next) => {

    try {
        const token = req.header('authorization');
        const userid = Number(jwt.verify(token, process.env.TOKEN_SECRET));
        User.findByPk(userid).then(user => {
            console.log(JSON.stringify(user));
            req.user = user;
            next();
        }).catch(err => { throw new Error(err)})

      } catch(err) {
        return res.status(401).json({success: false})
      }
}

module.exports = {
    authenticate
}